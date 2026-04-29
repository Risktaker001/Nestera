//! Emission schedule for the Nestera protocol token (#712).
//!
//! Defines how new tokens are released over time with:
//! - A configurable emission rate (tokens per second)
//! - A hard maximum supply cap
//! - Inflation control via admin/governance
//! - Predictable, auditable emission parameters stored on-chain

use crate::errors::SavingsError;
use crate::storage_types::DataKey;
use soroban_sdk::{contracttype, symbol_short, Address, Env};

// ---------------------------------------------------------------------------
// Storage types
// ---------------------------------------------------------------------------

/// On-chain emission configuration.
///
/// All amounts are in the token's smallest unit (7 decimal places for NST).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EmissionConfig {
    /// Tokens emitted per second (in smallest unit).
    /// Set to 0 to pause emissions without changing other parameters.
    pub emission_rate_per_second: i128,

    /// Absolute maximum supply that can ever exist.
    /// Minting is rejected once `total_supply >= max_supply`.
    pub max_supply: i128,

    /// Unix timestamp of the last emission mint.
    /// Used to calculate how many tokens are due since the last call.
    pub last_emission_time: u64,

    /// Cumulative tokens minted via the emission schedule (excludes genesis supply).
    pub total_emitted: i128,

    /// Whether the emission schedule is currently active.
    pub active: bool,
}

/// Storage keys for the emission module.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EmissionDataKey {
    /// The emission configuration struct.
    Config,
}

/// Event emitted when the emission config is initialised or updated.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EmissionConfigSet {
    pub emission_rate_per_second: i128,
    pub max_supply: i128,
    pub active: bool,
}

/// Event emitted when new tokens are released via the emission schedule.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokensEmitted {
    pub to: Address,
    pub amount: i128,
    pub total_emitted: i128,
    pub new_total_supply: i128,
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Reads the emission config from storage.
pub fn get_emission_config(env: &Env) -> Result<EmissionConfig, SavingsError> {
    env.storage()
        .instance()
        .get(&EmissionDataKey::Config)
        .ok_or(SavingsError::InternalError)
}

/// Persists the emission config to storage.
fn save_emission_config(env: &Env, config: &EmissionConfig) {
    env.storage()
        .instance()
        .set(&EmissionDataKey::Config, config);
}

/// Returns how many tokens are due for emission since `last_emission_time`.
///
/// Caps the result so that `total_supply + due <= max_supply`.
pub fn calculate_due_emission(
    env: &Env,
    config: &EmissionConfig,
    current_total_supply: i128,
) -> Result<i128, SavingsError> {
    if !config.active || config.emission_rate_per_second == 0 {
        return Ok(0);
    }

    let now = env.ledger().timestamp();
    if now <= config.last_emission_time {
        return Ok(0);
    }

    let elapsed = now
        .checked_sub(config.last_emission_time)
        .ok_or(SavingsError::Underflow)? as i128;

    let gross = config
        .emission_rate_per_second
        .checked_mul(elapsed)
        .ok_or(SavingsError::Overflow)?;

    // Enforce supply cap
    let remaining_cap = config
        .max_supply
        .checked_sub(current_total_supply)
        .unwrap_or(0);

    if remaining_cap <= 0 {
        return Ok(0);
    }

    Ok(gross.min(remaining_cap))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Initialises the emission schedule (admin only, one-time).
///
/// # Arguments
/// * `admin`                    - Must match the stored admin address.
/// * `emission_rate_per_second` - Tokens released per second (≥ 0).
/// * `max_supply`               - Hard cap on total token supply (> current supply).
/// * `active`                   - Whether to start emitting immediately.
pub fn initialize_emission(
    env: &Env,
    admin: Address,
    emission_rate_per_second: i128,
    max_supply: i128,
    active: bool,
) -> Result<(), SavingsError> {
    admin.require_auth();

    // Only admin may call this
    let stored_admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(SavingsError::Unauthorized)?;
    if admin != stored_admin {
        return Err(SavingsError::Unauthorized);
    }

    // Idempotency guard
    if env
        .storage()
        .instance()
        .has(&EmissionDataKey::Config)
    {
        return Err(SavingsError::ConfigAlreadyInitialized);
    }

    if emission_rate_per_second < 0 {
        return Err(SavingsError::InvalidAmount);
    }
    if max_supply <= 0 {
        return Err(SavingsError::InvalidAmount);
    }

    // Validate max_supply >= current total supply
    let metadata = crate::token::get_token_metadata(env)?;
    if max_supply < metadata.total_supply {
        return Err(SavingsError::AmountExceedsLimit);
    }

    let config = EmissionConfig {
        emission_rate_per_second,
        max_supply,
        last_emission_time: env.ledger().timestamp(),
        total_emitted: 0,
        active,
    };

    save_emission_config(env, &config);

    env.events().publish(
        (symbol_short!("emission"), symbol_short!("init")),
        EmissionConfigSet {
            emission_rate_per_second,
            max_supply,
            active,
        },
    );

    Ok(())
}

/// Updates emission parameters (admin or active governance only).
///
/// Can be used to change the rate, adjust the cap, or pause/resume emissions.
pub fn update_emission_config(
    env: &Env,
    caller: Address,
    emission_rate_per_second: i128,
    max_supply: i128,
    active: bool,
) -> Result<(), SavingsError> {
    caller.require_auth();
    crate::governance::validate_admin_or_governance(env, &caller)?;

    if emission_rate_per_second < 0 {
        return Err(SavingsError::InvalidAmount);
    }
    if max_supply <= 0 {
        return Err(SavingsError::InvalidAmount);
    }

    let metadata = crate::token::get_token_metadata(env)?;
    if max_supply < metadata.total_supply {
        return Err(SavingsError::AmountExceedsLimit);
    }

    let mut config = get_emission_config(env)?;
    config.emission_rate_per_second = emission_rate_per_second;
    config.max_supply = max_supply;
    config.active = active;

    save_emission_config(env, &config);

    env.events().publish(
        (symbol_short!("emission"), symbol_short!("update")),
        EmissionConfigSet {
            emission_rate_per_second,
            max_supply,
            active,
        },
    );

    Ok(())
}

/// Mints all tokens that have accrued since the last emission call.
///
/// Anyone may trigger this; tokens are sent to `recipient` (typically the
/// treasury or rewards pool).  The supply cap is enforced — if the cap has
/// been reached the call succeeds but mints 0 tokens.
///
/// Returns the number of tokens actually minted.
pub fn process_emission(env: &Env, recipient: Address) -> Result<i128, SavingsError> {
    let mut config = get_emission_config(env)?;

    let metadata = crate::token::get_token_metadata(env)?;
    let due = calculate_due_emission(env, &config, metadata.total_supply)?;

    // Always advance the timestamp so we don't double-count elapsed time
    config.last_emission_time = env.ledger().timestamp();

    if due == 0 {
        save_emission_config(env, &config);
        return Ok(0);
    }

    // Mint via the token module (updates total_supply)
    let new_total_supply = crate::token::mint(env, recipient.clone(), due)?;

    config.total_emitted = config
        .total_emitted
        .checked_add(due)
        .ok_or(SavingsError::Overflow)?;

    save_emission_config(env, &config);

    env.events().publish(
        (symbol_short!("emission"), symbol_short!("mint"), recipient.clone()),
        TokensEmitted {
            to: recipient,
            amount: due,
            total_emitted: config.total_emitted,
            new_total_supply,
        },
    );

    Ok(due)
}

/// Returns `true` when the current total supply has reached the configured cap.
pub fn is_supply_cap_reached(env: &Env) -> Result<bool, SavingsError> {
    let config = get_emission_config(env)?;
    let metadata = crate::token::get_token_metadata(env)?;
    Ok(metadata.total_supply >= config.max_supply)
}
