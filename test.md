# Task to implement 

[frontend] - Implement Proper Form Validation
Repo Avatar
Devsol-01/Nestera
Description
Forms throughout the application lack proper validation, error handling, and user feedback.

Forms Needing Validation
Newsletter subscription form (Newsletter.tsx)
Goal creation form (CreateGoalForm.tsx, GoalForm.tsx)
Support contact form (support/page.tsx)
Settings forms (dashboard/settings/)
Tasks
Install and configure a form library (React Hook Form recommended)
Add validation schemas (Zod or Yup)
Implement real-time validation feedback
Add proper error messages for each field
Implement success/error states
Add loading states during submission
Ensure accessibility (ARIA attributes, error announcements)
Example Validation Rules
Email: Valid format, required
Goal name: 3-50 characters, required
Target amount: Positive number, required
Date: Future date, required
Acceptance Criteria
 Form library installed and configured
 All forms have validation schemas
 Real-time validation feedback implemented
 Clear error messages displayed
 Forms are keyboard accessible
 Screen readers announce errors
 Loading states shown during submission

 # README FILE

 Nestera
Decentralized Savings & Investment Platform on Stellar

Nestera is a decentralized savings and investment protocol built on Stellar using Soroban smart contracts. It enables individuals and communities to save transparently using stablecoins, with flexible, locked, goal-based, and group savings mechanisms enforced fully on-chain.

The project solves the problem of opaque, centralized savings platforms in emerging markets by providing a non-custodial, transparent alternative where users maintain full control of their funds. Nestera is designed for developers, contributors, and financial communities interested in building open, composable savings infrastructure using low-fee, fast-finality blockchain primitives.

🚀 Core Features
Non-custodial savings via Soroban smart contracts
Flexible and locked savings with deterministic interest logic
Goal-based savings with automated milestones
Group savings pools with shared rules and governance
Native USDC-based savings on Stellar testnet
Web interface for seamless contract interaction
🏗 Architecture Overview
Frontend (apps/web)
Next.js application for interacting with Nestera smart contracts. Provides user interface for creating savings accounts, depositing funds, and tracking progress.

Backend (apps/api)
Node.js API for off-chain services such as indexing contract events, sending notifications, managing user metadata, and aggregating analytics.

Smart Contracts (contracts/)
Soroban smart contracts written in Rust that manage all savings logic, fund custody, interest calculations, and withdrawal rules.

📁 Repository Structure
/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Node.js backend API
├── contracts/            # Soroban smart contracts (Rust)
├── packages/             # Shared utilities and types
├── scripts/              # Deployment and automation scripts
├── tests/                # Integration and E2E tests
└── README.md
🛠 Setup Instructions
Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v18 or higher) - Download
npm or yarn - Comes with Node.js
Rust (stable toolchain) - Install
Soroban CLI - Instructions below
Stellar testnet account - We'll create this in setup
Installation Overview
Clone the repository
Set up smart contracts
Set up backend API
Set up frontend
Run tests
📦 1. Clone the Repository
git clone https://github.com/your-org/nestera.git
cd nestera
🔗 2. Smart Contracts Setup (Soroban)
Install Soroban CLI
cargo install --locked stellar-cli --features opt
Or use the install script:

curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh
Verify installation:

stellar --version
Configure Stellar Testnet
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
Generate Identity & Fund Account
stellar keys generate --global alice --network testnet
Get your address:

stellar keys address alice
Fund your account using Friendbot:

curl "https://friendbot.stellar.org?addr=$(stellar keys address alice)"
Verify balance:

stellar account balance --id alice --network testnet
Build Contracts
cd contracts
cargo build --target wasm32-unknown-unknown --release
Deploy Contracts
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nestera_contract.wasm \
  --source alice \
  --network testnet
Save the contract ID output - you'll need it for frontend and backend setup.

Initialize Contract (if required)
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source alice \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address alice)
🖥 3. Backend Setup (Node.js API)
cd apps/api
npm install
Create Environment File
Create .env in apps/api/:

PORT=3001
NODE_ENV=development

# Stellar Network
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org

# Contract
CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/nestera

# Optional
REDIS_URL=redis://localhost:6379
Run Database Migrations (if applicable)
npm run migrate
Start Backend Server
npm run dev
Backend should now be running at http://localhost:3001

Verify Backend
curl http://localhost:3001/health
🌐 4. Frontend Setup (Next.js)
cd frontend
pnpm install
Create Environment File
Create .env.local in frontend/:

NEXT_PUBLIC_BASE_URL=https://nestera.app
NEXT_PUBLIC_HORIZON_PUBLIC_URL=https://horizon.stellar.org
NEXT_PUBLIC_HORIZON_TESTNET_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_COINGECKO_API_URL=https://api.coingecko.com/api/v3
NEXT_PUBLIC_DISCORD_URL=https://discord.gg/nestera
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/nestera
NEXT_PUBLIC_GITHUB_URL=https://github.com/nestera
Run Development Server
pnpm dev
Frontend should now be running at http://localhost:3000

Build for Production
npm run build
npm start
🧪 5. Running Tests
Contract Tests
cd contracts
cargo test
Backend Tests
cd apps/api
npm test
Run with coverage:

npm run test:coverage
Frontend Tests
cd apps/web
npm test
Run E2E tests (requires running backend and deployed contracts):

npm run test:e2e
Integration Tests
From project root:

npm run test:integration
🌍 Network Configuration
Testnet
Network Passphrase: Test SDF Network ; September 2015
RPC URL: https://soroban-testnet.stellar.org:443
Horizon URL: https://horizon-testnet.stellar.org
Friendbot: https://friendbot.stellar.org
Contract Addresses (Testnet)
Main Savings Contract: CXXXXXX... (Update after deployment)
USDC Token: CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
🐛 Troubleshooting
Contract Deployment Fails
Error: insufficient balance

Solution: Fund your account using Friendbot:

curl "https://friendbot.stellar.org?addr=$(stellar keys address alice)"
Frontend Can't Connect to Wallet
Error: Failed to connect wallet

Solution:

Ensure you have Freighter wallet installed
Switch wallet to Testnet network
Check that NEXT_PUBLIC_STELLAR_NETWORK=testnet in .env.local
Backend Can't Index Events
Error: RPC connection timeout

Solution:

Verify RPC URL is correct in .env
Check Stellar testnet status: https://status.stellar.org
Try alternative RPC: https://soroban-testnet.stellar.org:443
Contract Build Fails
Error: wasm32-unknown-unknown target not found

Solution: Add wasm target:

rustup target add wasm32-unknown-unknown
Tests Failing
Error: Network connection error

Solution: Ensure contracts are deployed and environment variables are set correctly in test config.

📚 Documentation & Resources
Stellar Documentation: developers.stellar.org
Soroban Docs: soroban.stellar.org/docs
Off-Chain Oracle Architecture: contracts/README.md
Soroban Examples: github.com/stellar/soroban-examples
🤝 Contributing
See our detailed CONTRIBUTING.md for coding standards (Rust/Soroban, TypeScript), Git workflow, naming conventions, and full PR process.

🗺 Roadmap
Current Phase (Q1 2026)
✅ Core savings contract
✅ Basic web interface
🚧 Group savings pools
🚧 Interest calculation optimization
Next Phase (Q2 2026)
Goal-based savings UI
Notification system
Mobile app (Flutter)
Mainnet deployment
Future
Cross-chain savings
Yield strategies integration
DAO governance
Advanced analytics dashboard
