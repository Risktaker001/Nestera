//! Integration tests for issues:
//!   #714 — Token & Staking Integration Tests (full lifecycle)
//!   #712 — Emission Schedule
//!   #715 — Governance Proposal Cancellation
//!   #713 — Anti-Whale & Fair Distribution

#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, BytesN, Env, String as SorobanString, Symbol,
};

use Nestera::{NesteraContract, NesteraContractClient};

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

fn setup_env() -> (Env, NesteraContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(NesteraContract, ());
    let client = NesteraContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let admin_pk = BytesN::from_array(&env, &[1u8; 32]);
    client.initialize(&admin, &admin_pk);

    (env, client, admin)
}

/// Initialise staking with sensible defaults.
fn init_staking(
    client: &NesteraContractClient,
    admin: &Address,
    max_staking_limit: i128,
    max_wallet_holding: i128,
) {
    use Nestera::staking::storage_types::StakingConfig;
    let config = StakingConfig {
        min_stake_amount: 100,
        max_stake_amount: 1_000_000_000_000_000,
        reward_rate_bps: 500,
        enabled: true,
        lock_period_seconds: 0,
        max_staking_limit,
        max_wallet_holding,
    };
    client.init_staking_config(admin, &config);
}

/// Initialise governance voting config.
fn init_governance(client: &NesteraContractClient, admin: &Address) {
    client.init_voting_config(
        admin,
        &10u32,          // quorum
        &3600u64,        // voting_period (1 hour)
        &60u64,          // timelock_duration (1 minute)
        &0u128,          // proposal_threshold (no minimum)
        &1_000_000u128,  // max_voting_power
    );
    client.activate_governance(admin);
}

// ===========================================================================
// #714 — Token & Staking Integration Tests (full lifecycle)
// ===========================================================================

/// Full token lifecycle: mint → distribute rewards → stake → accrue rewards →
/// unstake & claim → burn → participate in governance.
#[test]
fn test_full_token_lifecycle() {
    let (env, client, admin) = setup_env();
    let user = Address::generate(&env);

    // ── 1. Mint tokens ──────────────────────────────────────────────────────
    let initial_supply = client
        .get_token_metadata()
        .expect("metadata")
        .total_supply;

    let mint_amount = 1_000_000i128;
    let new_supply = client
        .mint_tokens(&admin, &user, &mint_amount)
        .expect("mint");
    assert_eq!(new_supply, initial_supply + mint_amount);

    let meta = client.get_token_metadata().expect("metadata after mint");
    assert_eq!(meta.total_supply, new_supply);

    // ── 2. Distribute rewards (award points, convert to tokens) ─────────────
    // Initialise rewards config first
    client
        .init_rewards_config(
            &admin,
            &10u32,   // points_per_token
            &500u32,  // streak_bonus_bps
            &1000u32, // long_lock_bonus_bps
            &100u32,  // goal_completion_bonus
            &true,    // enabled
            &1i128,   // min_deposit_for_rewards
            &0u64,    // action_cooldown_seconds
            &10_000u128, // max_daily_points
            &200u32,  // max_streak_multiplier
        )
        .expect("init rewards");

    // Deposit to flexi to earn points
    client.initialize_user(&user).expect("init user");
    client.deposit_flexi(&user, &10_000i128).expect("deposit");

    // Convert points to tokens
    let user_rewards = client.get_user_rewards(&user);
    if user_rewards.total_points > 0 {
        client
            .convert_points_to_tokens(&user, &user_rewards.total_points, &1i128)
            .expect("convert");
    }

    // ── 3. Stake tokens ──────────────────────────────────────────────────────
    init_staking(&client, &admin, 0, 0);

    let stake_amount = 500_000i128;
    client.stake(&user, &stake_amount).expect("stake");

    let stake_info = client.get_user_stake(&user);
    assert_eq!(stake_info.amount, stake_amount);

    let (total_staked, _, _) = client.get_staking_stats().expect("stats");
    assert_eq!(total_staked, stake_amount);

    // ── 4. Accrue staking rewards ────────────────────────────────────────────
    // Advance ledger time by 30 days
    env.ledger().with_mut(|l| {
        l.timestamp += 30 * 24 * 60 * 60;
    });

    let pending = client
        .get_pending_staking_rewards(&user)
        .expect("pending rewards");
    assert!(pending >= 0, "pending rewards should be non-negative");

    // ── 5. Unstake and claim ─────────────────────────────────────────────────
    let (returned_amount, rewards) = client.unstake(&user, &stake_amount).expect("unstake");
    assert_eq!(returned_amount, stake_amount);
    assert!(rewards >= 0);

    let stake_after = client.get_user_stake(&user);
    assert_eq!(stake_after.amount, 0);

    // ── 6. Burn tokens ───────────────────────────────────────────────────────
    let supply_before_burn = client.get_token_metadata().expect("meta").total_supply;
    let burn_amount = 100_000i128;
    let supply_after_burn = client.burn(&user, &burn_amount).expect("burn");
    assert_eq!(supply_after_burn, supply_before_burn - burn_amount);

    // ── 7. Participate in governance ─────────────────────────────────────────
    init_governance(&client, &admin);

    let proposal_id = client
        .create_proposal(
            &user,
            &SorobanString::from_str(&env, "Increase staking rewards"),
        )
        .expect("create proposal");

    // Cast a vote
    client.vote(&proposal_id, &1u32, &user).expect("vote");
    assert!(client.has_voted(&proposal_id, &user));

    let (for_votes, against_votes, _) = client.get_proposal_votes(&proposal_id);
    assert!(for_votes > 0);
    assert_eq!(against_votes, 0);
}

/// Staking rewards accrue correctly over time.
#[test]
fn test_staking_rewards_accrue_over_time() {
    let (env, client, admin) = setup_env();
    let user = Address::generate(&env);

    init_staking(&client, &admin, 0, 0);

    client.stake(&user, &1_000_000i128).expect("stake");

    // No time has passed — pending rewards should be 0
    let pending_initial = client
        .get_pending_staking_rewards(&user)
        .expect("pending");
    assert_eq!(pending_initial, 0);

    // Advance 365 days
    env.ledger().with_mut(|l| {
        l.timestamp += 365 * 24 * 60 * 60;
    });

    let pending_after_year = client
        .get_pending_staking_rewards(&user)
        .expect("pending after year");
    // At 5% APY on 1_000_000 over 1 year we expect ~50_000 (scaled by precision)
    assert!(
        pending_after_year > 0,
        "rewards should have accrued after 1 year"
    );
}

/// Unstake returns principal and accumulated rewards.
#[test]
fn test_unstake_returns_principal_and_rewards() {
    let (env, client, admin) = setup_env();
    let user = Address::generate(&env);

    init_staking(&client, &admin, 0, 0);

    let stake_amount = 500_000i128;
    client.stake(&user, &stake_amount).expect("stake");

    env.ledger().with_mut(|l| {
        l.timestamp += 90 * 24 * 60 * 60; // 90 days
    });

    let (returned, rewards) = client.unstake(&user, &stake_amount).expect("unstake");
    assert_eq!(returned, stake_amount, "principal must be returned in full");
    assert!(rewards >= 0, "rewards must be non-negative");
}

/// Claim staking rewards separately (without unstaking).
#[test]
fn test_claim_staking_rewards_without_unstaking() {
    let (env, client, admin) = setup_env();
    let user = Address::generate(&env);

    init_staking(&client, &admin, 0, 0);
    client.stake(&user, &1_000_000i128).expect("stake");

    env.ledger().with_mut(|l| {
        l.timestamp += 180 * 24 * 60 * 60;
    });

    let claimed = client
        .claim_staking_rewards(&user)
        .expect("claim rewards");
    assert!(claimed > 0, "should have rewards to claim after 180 days");

    // Stake should still be intact
    let stake = client.get_user_stake(&user);
    assert_eq!(stake.amount, 1_000_000i128);
}

/// Burn reduces total supply correctly.
#[test]
fn test_burn_reduces_total_supply() {
    let (env, client, admin) = setup_env();
    let user = Address::generate(&env);

    let supply_before = client.get_token_metadata().expect("meta").total_supply;

    // Mint some tokens to the user first
    client
        .mint_tokens(&admin, &user, &500_000i128)
        .expect("mint");

    let supply_after_mint = client.get_token_metadata().expect("meta").total_supply;
    assert_eq!(supply_after_mint, supply_before + 500_000);

    // Burn
    let supply_after_burn = client.burn(&user, &200_000i128).expect("burn");
    assert_eq!(supply_after_burn, supply_after_mint - 200_000);
}

/// Minting is restricted to admin / governance.
#[test]
#[should_panic]
fn test_mint_unauthorized_fails() {
    let (_env, client, _admin) = setup_env();
    let attacker = Address::generate(&_env);
    let victim = Address::generate(&_env);

    // Attacker tries to mint — should panic
    client
        .mint_tokens(&attacker, &victim, &1_000_000i128)
        .expect("should fail");
}

// ===========================================================================
// #712 — Emission Schedule
// ===========================================================================

/// Emission config can be initialised and queried.
#[test]
fn test_emission_initialize() {
    let (_env, client, admin) = setup_env();

    client
        .initialize_emission(&admin, &10i128, &2_000_000_000_0000000i128, &true)
        .expect("init emission");

    let config = client.get_emission_config().expect("get config");
    assert_eq!(config.emission_rate_per_second, 10);
    assert_eq!(config.max_supply, 2_000_000_000_0000000);
    assert!(config.active);
    assert_eq!(config.total_emitted, 0);
}

/// Emission cannot be initialised twice.
#[test]
#[should_panic]
fn test_emission_double_init_fails() {
    let (_env, client, admin) = setup_env();

    client
        .initialize_emission(&admin, &10i128, &2_000_000_000_0000000i128, &true)
        .expect("first init");

    // Second call should panic
    client
        .initialize_emission(&admin, &5i128, &2_000_000_000_0000000i128, &true)
        .expect("second init should fail");
}

/// Tokens are emitted proportionally to elapsed time.
#[test]
fn test_emission_mints_correct_amount() {
    let (env, client, admin) = setup_env();
    let treasury = Address::generate(&env);

    let rate = 100i128; // 100 tokens/second
    client
        .initialize_emission(&admin, &rate, &2_000_000_000_0000000i128, &true)
        .expect("init");

    // Advance 10 seconds
    env.ledger().with_mut(|l| {
        l.timestamp += 10;
    });

    let minted = client.process_emission(&treasury).expect("process");
    assert_eq!(minted, rate * 10, "should mint rate × elapsed seconds");
}

/// Supply cap is enforced — no tokens minted beyond max_supply.
#[test]
fn test_emission_supply_cap_enforced() {
    let (env, client, admin) = setup_env();
    let treasury = Address::generate(&env);

    let current_supply = client.get_token_metadata().expect("meta").total_supply;
    // Set cap just 500 tokens above current supply
    let cap = current_supply + 500;

    client
        .initialize_emission(&admin, &1000i128, &cap, &true)
        .expect("init");

    // Advance enough time that gross emission would exceed the cap
    env.ledger().with_mut(|l| {
        l.timestamp += 10_000;
    });

    let minted = client.process_emission(&treasury).expect("process");
    assert!(
        minted <= 500,
        "minted ({}) must not exceed remaining cap (500)",
        minted
    );

    assert!(
        client.is_supply_cap_reached().expect("cap check"),
        "supply cap should be reached"
    );
}

/// Emission can be paused by setting active = false.
#[test]
fn test_emission_can_be_paused() {
    let (env, client, admin) = setup_env();
    let treasury = Address::generate(&env);

    client
        .initialize_emission(&admin, &100i128, &2_000_000_000_0000000i128, &true)
        .expect("init");

    // Pause emissions
    client
        .update_emission_config(&admin, &100i128, &2_000_000_000_0000000i128, &false)
        .expect("pause");

    env.ledger().with_mut(|l| {
        l.timestamp += 1000;
    });

    let minted = client.process_emission(&treasury).expect("process while paused");
    assert_eq!(minted, 0, "no tokens should be minted while paused");
}

/// Emission rate can be updated by admin.
#[test]
fn test_emission_rate_update() {
    let (_env, client, admin) = setup_env();

    client
        .initialize_emission(&admin, &50i128, &2_000_000_000_0000000i128, &true)
        .expect("init");

    client
        .update_emission_config(&admin, &200i128, &2_000_000_000_0000000i128, &true)
        .expect("update");

    let config = client.get_emission_config().expect("config");
    assert_eq!(config.emission_rate_per_second, 200);
}

/// Unauthorised caller cannot initialise emission.
#[test]
#[should_panic]
fn test_emission_unauthorized_init_fails() {
    let (_env, client, _admin) = setup_env();
    let attacker = Address::generate(&_env);

    client
        .initialize_emission(&attacker, &10i128, &2_000_000_000_0000000i128, &true)
        .expect("should fail");
}

// ===========================================================================
// #715 — Governance Proposal Cancellation
// ===========================================================================

/// Proposal creator can cancel their own proposal.
#[test]
fn test_creator_can_cancel_proposal() {
    let (env, client, admin) = setup_env();
    let creator = Address::generate(&env);

    init_governance(&client, &admin);

    let proposal_id = client
        .create_proposal(
            &creator,
            &SorobanString::from_str(&env, "Test proposal"),
        )
        .expect("create");

    client
        .cancel_proposal(&proposal_id, &creator)
        .expect("cancel by creator");

    // Proposal should now be canceled — voting should fail
    let result = client.vote(&proposal_id, &1u32, &creator);
    assert!(result.is_err(), "voting on canceled proposal should fail");
}

/// Admin can cancel any proposal.
#[test]
fn test_admin_can_cancel_any_proposal() {
    let (env, client, admin) = setup_env();
    let creator = Address::generate(&env);

    init_governance(&client, &admin);

    let proposal_id = client
        .create_proposal(
            &creator,
            &SorobanString::from_str(&env, "Admin cancels this"),
        )
        .expect("create");

    // Admin cancels a proposal they did not create
    client
        .cancel_proposal(&proposal_id, &admin)
        .expect("admin cancel");
}

/// Unauthorised user cannot cancel someone else's proposal.
#[test]
#[should_panic]
fn test_unauthorized_cannot_cancel_proposal() {
    let (env, client, admin) = setup_env();
    let creator = Address::generate(&env);
    let attacker = Address::generate(&env);

    init_governance(&client, &admin);

    let proposal_id = client
        .create_proposal(
            &creator,
            &SorobanString::from_str(&env, "Proposal"),
        )
        .expect("create");

    // Attacker tries to cancel — should panic
    client
        .cancel_proposal(&proposal_id, &attacker)
        .expect("should fail");
}

/// An already-executed proposal cannot be canceled.
#[test]
#[should_panic]
fn test_executed_proposal_cannot_be_canceled() {
    let (env, client, admin) = setup_env();
    let creator = Address::generate(&env);

    init_governance(&client, &admin);

    // Create an action proposal
    let proposal_id = client
        .create_action_proposal(
            &creator,
            &SorobanString::from_str(&env, "Set flexi rate"),
            &Nestera::governance::ProposalAction::SetFlexiRate(500),
        )
        .expect("create action proposal");

    // Vote for it
    client.vote(&proposal_id, &1u32, &creator).expect("vote");

    // Advance past voting period
    env.ledger().with_mut(|l| {
        l.timestamp += 7200; // 2 hours
    });

    // Queue
    client.queue_proposal(&proposal_id).expect("queue");

    // Advance past timelock
    env.ledger().with_mut(|l| {
        l.timestamp += 120; // 2 minutes
    });

    // Execute
    client.execute_proposal(&proposal_id).expect("execute");

    // Now try to cancel — should panic
    client
        .cancel_proposal(&proposal_id, &creator)
        .expect("should fail");
}

/// A canceled proposal cannot be canceled again.
#[test]
#[should_panic]
fn test_double_cancel_fails() {
    let (env, client, admin) = setup_env();
    let creator = Address::generate(&env);

    init_governance(&client, &admin);

    let proposal_id = client
        .create_proposal(
            &creator,
            &SorobanString::from_str(&env, "Double cancel test"),
        )
        .expect("create");

    client
        .cancel_proposal(&proposal_id, &creator)
        .expect("first cancel");

    // Second cancel should panic
    client
        .cancel_proposal(&proposal_id, &creator)
        .expect("second cancel should fail");
}

/// A queued proposal can still be canceled before execution.
#[test]
fn test_queued_proposal_can_be_canceled() {
    let (env, client, admin) = setup_env();
    let creator = Address::generate(&env);

    init_governance(&client, &admin);

    let proposal_id = client
        .create_proposal(
            &creator,
            &SorobanString::from_str(&env, "Queued cancel test"),
        )
        .expect("create");

    // Vote for it
    client.vote(&proposal_id, &1u32, &creator).expect("vote");

    // Advance past voting period
    env.ledger().with_mut(|l| {
        l.timestamp += 7200;
    });

    // Queue
    client.queue_proposal(&proposal_id).expect("queue");

    // Cancel while queued (before execution)
    client
        .cancel_proposal(&proposal_id, &creator)
        .expect("cancel queued proposal");
}

// ===========================================================================
// #713 — Anti-Whale & Fair Distribution
// ===========================================================================

/// Staking limit is enforced — user cannot stake beyond max_staking_limit.
#[test]
#[should_panic]
fn test_staking_limit_enforced() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    // Set max staking limit to 1_000
    init_staking(&client, &admin, 1_000i128, 0);

    // First stake within limit
    client.stake(&user, &800i128).expect("first stake");

    // Second stake would push total to 1_300 — should panic
    client.stake(&user, &500i128).expect("should fail");
}

/// Staking limit of 0 means no limit.
#[test]
fn test_no_staking_limit_when_zero() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    init_staking(&client, &admin, 0, 0); // 0 = no limit

    // Should be able to stake large amounts
    client.stake(&user, &500_000_000i128).expect("large stake");
    client.stake(&user, &500_000_000i128).expect("second large stake");
}

/// Multiple users can each stake up to the limit independently.
#[test]
fn test_staking_limit_is_per_user() {
    let (env, client, admin) = setup_env();
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    init_staking(&client, &admin, 1_000i128, 0);

    // Both users can stake up to the limit
    client.stake(&user1, &1_000i128).expect("user1 stake");
    client.stake(&user2, &1_000i128).expect("user2 stake");

    let stake1 = client.get_user_stake(&user1);
    let stake2 = client.get_user_stake(&user2);
    assert_eq!(stake1.amount, 1_000);
    assert_eq!(stake2.amount, 1_000);
}

/// Staking exactly at the limit is allowed.
#[test]
fn test_staking_exactly_at_limit_allowed() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    init_staking(&client, &admin, 5_000i128, 0);

    client.stake(&user, &5_000i128).expect("stake at limit");

    let stake = client.get_user_stake(&user);
    assert_eq!(stake.amount, 5_000);
}

/// Staking one token over the limit is rejected.
#[test]
#[should_panic]
fn test_staking_one_over_limit_fails() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    init_staking(&client, &admin, 5_000i128, 0);

    // Stake 5_001 — one over the limit
    client.stake(&user, &5_001i128).expect("should fail");
}

/// Cumulative staking across multiple calls is checked against the limit.
#[test]
#[should_panic]
fn test_cumulative_staking_limit_enforced() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    init_staking(&client, &admin, 1_000i128, 0);

    client.stake(&user, &600i128).expect("first stake");
    // 600 + 500 = 1_100 > 1_000 — should panic
    client.stake(&user, &500i128).expect("should fail");
}

/// After unstaking, user can stake again up to the limit.
#[test]
fn test_can_restake_after_unstake() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    init_staking(&client, &admin, 1_000i128, 0);

    client.stake(&user, &1_000i128).expect("stake");
    client.unstake(&user, &1_000i128).expect("unstake");

    // Should be able to stake again
    client.stake(&user, &1_000i128).expect("restake after unstake");
}

/// Staking below minimum is rejected.
#[test]
#[should_panic]
fn test_staking_below_minimum_fails() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    init_staking(&client, &admin, 0, 0);

    // min_stake_amount is 100 in default config
    client.stake(&user, &50i128).expect("should fail");
}

/// Staking with disabled config is rejected.
#[test]
#[should_panic]
fn test_staking_disabled_fails() {
    let (_env, client, admin) = setup_env();
    let user = Address::generate(&_env);

    use Nestera::staking::storage_types::StakingConfig;
    let config = StakingConfig {
        min_stake_amount: 100,
        max_stake_amount: 1_000_000_000_000_000,
        reward_rate_bps: 500,
        enabled: false, // disabled
        lock_period_seconds: 0,
        max_staking_limit: 0,
        max_wallet_holding: 0,
    };
    client.init_staking_config(admin, &config);

    client.stake(&user, &1_000i128).expect("should fail");
}

/// Staking stats reflect total staked across all users.
#[test]
fn test_staking_stats_reflect_all_users() {
    let (env, client, admin) = setup_env();
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    init_staking(&client, &admin, 0, 0);

    client.stake(&user1, &300_000i128).expect("user1");
    client.stake(&user2, &700_000i128).expect("user2");

    let (total_staked, _, _) = client.get_staking_stats().expect("stats");
    assert_eq!(total_staked, 1_000_000);
}
