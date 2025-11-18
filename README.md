# 🌉 ShadowBridge

**Private Payments. Public Trust.**

A privacy-preserving cross-chain payment bridge that enables compliant, private transfers between Midnight Network and Ethereum using zero-knowledge proofs.

## 🎯 Overview

ShadowBridge solves the problem of expensive and privacy-exposing cross-border payments by providing:
- **Privacy**: Zero-knowledge proofs ensure sensitive data stays private
- **Compliance**: Built-in KYC, sanctions, and amount range checks
- **Low Cost**: 1.5% fee vs. traditional 7% remittance fees
- **Cross-Chain**: Seamless transfers from Midnight to Ethereum (Sepolia)

## 📍 Deployed Contracts

### ✅ Live on Midnight TestNet-02

**PaymentProcessor Contract**
- **Address**: `02008e9077d6eddf643ffc8293abfaba3fc0c953eb983fa4e407dce958a61cfe456e`
- **Network**: Midnight TestNet-02
- **Status**: ✅ **LIVE & VERIFIED**
- **Deployed**: November 17, 2025
- **Explorer**: [Midnight Indexer](https://indexer.testnet-02.midnight.network)
- **Purpose**: Private transfer registration with ZK proof verification

**What it does:**
- Registers private transfers with zero-knowledge proofs
- Stores commitments (hashes) publicly, data privately
- Enforces compliance checks (KYC, sanctions, amount limits)
- Enables privacy-preserving cross-chain payments

### ✅ Live on Ethereum Sepolia Testnet

**BridgeReceiver Contract**
- **Address**: `0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89`
- **Network**: Sepolia Testnet
- **Status**: ✅ **LIVE & VERIFIED**
- **Explorer**: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89)
- **Purpose**: Receives and processes cross-chain transfers from Midnight

**WrappedToken Contract (wUSDC)**
- **Address**: `0xDA9b99B67da148125106208D9A25E642eeF5Bf1c`
- **Network**: Sepolia Testnet
- **Status**: ✅ **LIVE & VERIFIED**
- **Explorer**: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xDA9b99B67da148125106208D9A25E642eeF5Bf1c)
- **Purpose**: ERC20 token representing bridged USDC (18 decimals)

## ✅ Proof of Working System

### Verified Transactions

The contracts are **live and processing real transactions**. Here's proof:

1. **Midnight Contract**: Successfully deployed and accepting `registerTransfer()` calls
   - Contract address verified on Midnight TestNet-02
   - ZK proof verification working
   - Private transaction registration functional

2. **Ethereum Contracts**: Successfully deployed and processing transfers
   - BridgeReceiver contract verified on Sepolia Etherscan
   - WrappedToken contract verified on Sepolia Etherscan
   - Cross-chain transfers executing successfully

### How to Verify

**Check Midnight Contract:**
```bash
# Query Midnight Indexer
curl -X POST https://indexer.testnet-02.midnight.network/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { contractAction(contract: \"02008e9077d6eddf643ffc8293abfaba3fc0c953eb983fa4e407dce958a61cfe456e\") { transaction { hash } } }"
  }'
```

**Check Ethereum Contracts:**
- Visit [BridgeReceiver on Etherscan](https://sepolia.etherscan.io/address/0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89)
- Visit [WrappedToken on Etherscan](https://sepolia.etherscan.io/address/0xDA9b99B67da148125106208D9A25E642eeF5Bf1c)
- View recent transactions to see live activity

### Test the System

1. **Connect Wallets**
   - Lace Wallet (Midnight)
   - MetaMask (Sepolia)

2. **Make a Transfer**
   - Go to `http://localhost:3000/app`
   - Enter recipient address and amount
   - Click "Send Payment"

3. **Verify on Block Explorers**
   - Check transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)
   - View transaction history in the app
   - Click the external link icon to see on Etherscan

### Contract Interaction Flow

```
User → Frontend
  ↓
Frontend → Midnight Contract (registerTransfer)
  ↓ Address: 02008e9077d6eddf643ffc8293abfaba3fc0c953eb983fa4e407dce958a61cfe456e
  ↓ Creates private transaction with ZK proofs
  ↓
Frontend → Relayer API
  ↓
Relayer → Ethereum BridgeReceiver
  ↓ Address: 0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89
  ↓ Processes cross-chain transfer
  ↓
BridgeReceiver → WrappedToken
  ↓ Address: 0xDA9b99B67da148125106208D9A25E642eeF5Bf1c
  ↓ Mints wUSDC to recipient
  ↓
✅ Transaction Complete
```

## 🏗️ Architecture

ShadowBridge consists of three main components working together:

```
┌─────────────┐
│   Frontend  │  React + TypeScript + Vite
│  (Browser)  │  - Wallet connection (Lace/MetaMask)
└──────┬──────┘  - ZK proof generation
       │         - Transaction submission
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  Midnight  │   │   Relayer    │  Node.js + Express
│  Network   │   │  (Backend)   │  - Midnight contract service
│            │   │              │  - Proof verification
└──────┬──────┘  │              │  - Ethereum bridge client
       │         │              │  - Transfer processing
       │         └──────┬───────┘
       │                │
       │                ▼
       │         ┌──────────────┐
       │         │  Ethereum    │  Sepolia Testnet
       │         │  (Sepolia)   │  - BridgeReceiver contract
       │         │              │  - WrappedToken (wUSDC)
       └─────────┴──────────────┘
```

### Component Breakdown

#### 1. **Frontend** (`frontend/`)
- **Technology**: React, TypeScript, Tailwind CSS, Vite
- **Responsibilities**:
  - User interface for payment initiation
  - Wallet connection (Lace Wallet for Midnight, MetaMask for Ethereum)
  - ZK proof generation (KYC, Amount, Sanctions)
  - Transaction submission and status tracking
  - Transaction history display

#### 2. **Relayer** (`relayer/`)
- **Technology**: Node.js, Express, TypeScript
- **Responsibilities**:
  - Midnight contract interaction (registers transfers on Midnight)
  - ZK proof verification
  - Cross-chain bridge execution
  - Transfer queue management
  - Ethereum transaction submission

#### 3. **Smart Contracts**

**Midnight Contract** (`contracts/midnight/`)
- **Language**: Compact (Midnight's DSL)
- **Contract**: `PaymentProcessor.compact`
- **Purpose**: Private transfer registration on Midnight Network
- **Key Functions**:
  - `registerTransfer()`: Creates private transaction with ZK proofs
  - Stores commitments (sender, recipient, amount) privately
  - Enforces compliance checks (KYC, sanctions, amount limits)

**Ethereum Contracts** (`contracts/ethereum/`)
- **Language**: Solidity
- **Contracts**:
  - `BridgeReceiver.sol`: Receives and processes cross-chain transfers
  - `WrappedToken.sol`: ERC20 token (wUSDC) for bridged funds
- **Network**: Sepolia Testnet

#### 4. **Prover Service** (`relayer/prover/`)
- **Technology**: Node.js, Circom, snarkjs
- **Purpose**: Generates Groth16 ZK proofs for compliance circuits
- **Circuits**:
  - KYC proof: Verifies user identity without revealing it
  - Amount proof: Proves amount is within allowed range
  - Sanctions proof: Verifies user is not on sanctions list

## 🌙 Midnight's Role: The Backbone of Privacy

**Midnight Network is the core privacy layer** that makes ShadowBridge truly private and compliant.

### Why Midnight?

1. **Privacy by Design**
   - Midnight is built for private smart contract execution
   - Data is encrypted on-chain, only commitments are public
   - Perfect for financial privacy requirements

2. **ZK-Native Infrastructure**
   - Midnight's Compact language is designed for ZK proofs
   - Built-in support for witness generation and proof verification
   - Efficient proof generation and verification

3. **Compliance-Friendly**
   - Private execution with public auditability
   - Can prove compliance without revealing sensitive data
   - Ideal for regulated financial applications

### How Midnight Fits in the Flow

```
User Flow with Midnight:

1. User initiates payment on Frontend
   └─> Generates ZK proofs (KYC, Amount, Sanctions)

2. Frontend → Relayer → Midnight Contract
   └─> registerTransfer() creates PRIVATE transaction
   └─> Only commitments (hashes) are public
   └─> Sensitive data (sender, recipient, amount) stays encrypted

3. Midnight Network processes transaction
   └─> Validates ZK proofs
   └─> Stores transfer record privately
   └─> Returns transaction hash

4. Frontend → Relayer API
   └─> Submits transfer with Midnight tx hash
   └─> Relayer verifies proofs and processes

5. Relayer → Ethereum BridgeReceiver
   └─> Submits cross-chain transfer
   └─> Mints wUSDC tokens to recipient

6. Recipient receives tokens on Ethereum
   └─> Transaction is private on Midnight
   └─> Only final Ethereum transaction is public
```

### Key Privacy Features Enabled by Midnight

1. **Private Transfer Registration**
   - `registerTransfer()` stores only commitments (hashes)
   - Actual sender, recipient, and amount are encrypted
   - Only the relayer (with proofs) can verify and process

2. **ZK Proof Verification**
   - Midnight contract verifies ZK proofs on-chain
   - Proves compliance without revealing data
   - KYC, sanctions, and amount checks happen privately

3. **Audit Trail**
   - Public commitments allow for compliance auditing
   - Private data remains encrypted
   - Best of both worlds: privacy + compliance

## 🔄 Complete Transaction Flow

### Step-by-Step Process

1. **User Initiates Payment**
   ```typescript
   // Frontend generates ZK proofs
   const proofs = await generateAllProofs(amount, sender, recipient);
   // - KYC proof: Proves identity without revealing it
   // - Amount proof: Proves amount is within $1-$10,000
   // - Sanctions proof: Proves user is not on sanctions list
   ```

2. **Register on Midnight** (Privacy Layer)
   ```typescript
   // Frontend → Relayer → Midnight Contract
   const midnightTx = await registerOnMidnight(
     messageHash,
     recipient,
     amount,
     proofs
   );
   // Creates PRIVATE transaction on Midnight
   // Only commitments are public
   ```

3. **Submit to Relayer**
   ```typescript
   // Frontend submits with Midnight tx hash
   const result = await submitTransfer({
     sender,
     recipient,
     amountUsd: amount,
     proofs,
     sourceTxHash: midnightTx.txHash, // Links to Midnight
   });
   ```

4. **Relayer Processes**
   ```typescript
   // Relayer verifies proofs
   proofVerifier.verify(proofs);
   
   // Submits to Ethereum
   bridgeClient.processTransfer(transfer);
   ```

5. **Ethereum Execution**
   ```solidity
   // BridgeReceiver contract
   function processCrossChainTransfer(
     address recipient,
     uint256 amount,
     bytes32 messageHash,
     bytes calldata proof
   ) external {
     // Mints wUSDC tokens to recipient
     wrappedToken.transfer(recipient, amount);
   }
   ```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Lace Wallet (Chrome extension) for Midnight
- MetaMask for Ethereum
- Midnight Proof Server (Docker) for ZK proof generation

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shadowbridge
   ```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
   ```

3. **Install Relayer Dependencies**
   ```bash
   cd ../relayer
   npm install
   ```

4. **Install Ethereum Contracts Dependencies**
   ```bash
   cd ../contracts/ethereum
   npm install
   ```

5. **Install Midnight Contracts Dependencies**
```bash
   cd ../midnight
npm install
   ```

### Configuration

1. **Relayer Environment** (`relayer/.env`)
   ```env
   # Ethereum Configuration
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   ETHEREUM_BRIDGE_ADDRESS=0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89
   ETHEREUM_PRIVATE_KEY=0x...
   USDC_DECIMALS=18

   # Midnight Configuration
   MIDNIGHT_RPC_URL=https://rpc.testnet-02.midnight.network
   MIDNIGHT_INDEXER_URL=https://indexer.testnet-02.midnight.network/api/v1/graphql
   MIDNIGHT_CONTRACT_ADDRESS=02008e9077d6eddf643ffc8293abfaba3fc0c953eb983fa4e407dce958a61cfe456e
   MIDNIGHT_PROOF_SERVER=http://127.0.0.1:6300

   # Service Configuration
   PORT=3001
   MIN_AMOUNT=1
   MAX_AMOUNT=10000
   FEE_BPS=150
   ```

2. **Frontend Environment** (`frontend/.env`)
   ```env
   VITE_RELAYER_URL=http://localhost:3001
   VITE_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   VITE_ETHEREUM_BRIDGE_CONTRACT=0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89
   VITE_WUSDC_TOKEN_ADDRESS=0xDA9b99B67da148125106208D9A25E642eeF5Bf1c
   VITE_MIDNIGHT_CONTRACT_ADDRESS=02008e9077d6eddf643ffc8293abfaba3fc0c953eb983fa4e407dce958a61cfe456e
   VITE_MIDNIGHT_RPC_URL=https://rpc.testnet-02.midnight.network
   VITE_MIDNIGHT_INDEXER_URL=https://indexer.testnet-02.midnight.network/api/v1/graphql
   ```

### Running the Application

1. **Start Midnight Proof Server** (Required for ZK proofs)
   ```bash
   docker run -p 6300:6300 midnightnetwork/proof-server \
     -- 'midnight-proof-server --network testnet'
   ```

2. **Start Relayer**
```bash
cd relayer
npm run dev
# Runs on http://localhost:3001
```

3. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # Opens http://localhost:3000
   ```

4. **Deploy Contracts** (First time only)
   ```bash
   # Deploy Ethereum contracts
   cd contracts/ethereum
   npx hardhat run scripts/deploy.ts --network sepolia

   # Deploy Midnight contract
   cd ../midnight
   npm run build
   npm run deploy
   ```

## 📊 Key Features

### Privacy Features
- ✅ Zero-knowledge proofs for KYC, amount, and sanctions
- ✅ Private transaction registration on Midnight
- ✅ Encrypted data storage on Midnight
- ✅ Public commitments for auditability

### Compliance Features
- ✅ KYC verification (ZK proof)
- ✅ Sanctions screening (ZK proof)
- ✅ Amount limits ($1 - $10,000)
- ✅ Audit trail via public commitments

### User Experience
- ✅ Simple, intuitive interface
- ✅ Real-time transaction status
- ✅ Transaction history with Etherscan links
- ✅ Wallet balance tracking
- ✅ Toast notifications

## 🔐 Security & Privacy

### Zero-Knowledge Proofs
- **KYC Proof**: Verifies user identity without revealing personal information
- **Amount Proof**: Proves amount is within allowed range without revealing exact amount
- **Sanctions Proof**: Verifies user is not on sanctions list without revealing identity

### Smart Contract Security
- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Access Control**: Only relayer can process transfers
- **Message Hash Tracking**: Prevents double-spending

### Privacy Guarantees
- **Midnight Network**: All sensitive data encrypted on-chain
- **Commitment Scheme**: Only hashes are public, not actual data
- **ZK Proofs**: Compliance proven without data disclosure

## 🧪 Testing

### Test a Transfer

1. **Connect Wallets**
   - Connect Lace Wallet (Midnight)
   - Connect MetaMask (Ethereum Sepolia)

2. **Initiate Transfer**
   - Enter recipient Ethereum address
   - Enter amount ($1 - $10,000)
   - Click "Send Payment"

3. **Monitor Progress**
   - Watch console logs for step-by-step progress
   - Check transaction history
   - View on Etherscan when complete

### Expected Flow

```
✅ Step 1/4: ZK proofs generated
✅ Step 2/4: Transfer registered on Midnight
✅ Step 3/4: Transfer submitted to relayer
✅ Step 4/4: Transfer processed on Ethereum
```

## 📁 Project Structure

```
shadowbridge/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services, wallet, prover
│   │   └── styles/       # CSS styles
│   └── package.json
│
├── relayer/              # Backend relayer service
│   ├── src/
│   │   ├── services/     # Transfer, bridge, proof verification
│   │   ├── routes/       # API routes
│   │   └── config/       # Configuration
│   ├── prover/           # ZK proof generation service
│   └── package.json
│
├── contracts/
│   ├── ethereum/         # Solidity contracts
│   │   ├── src/          # BridgeReceiver, WrappedToken
│   │   └── scripts/      # Deployment scripts
│   └── midnight/         # Compact contracts
│       ├── contracts/    # PaymentProcessor.compact
│       └── build/        # Compiled contracts
│
└── README.md
```

## 🏆 Built for Midnight Summit Hackathon

ShadowBridge demonstrates:
- **Full Midnight Integration**: Every transfer goes through Midnight
- **Privacy + Compliance**: ZK proofs enable both
- **Production-Ready**: Real contracts, real proofs, real transfers
- **User-Friendly**: Simple interface, clear flow
- **Live & Verified**: All contracts deployed and working on testnets

### Contract Verification

✅ **Midnight PaymentProcessor**: Deployed and verified on TestNet-02
- Address: `02008e9077d6eddf643ffc8293abfaba3fc0c953eb983fa4e407dce958a61cfe456e`
- Status: Processing private transfers with ZK proofs

✅ **Ethereum BridgeReceiver**: Deployed and verified on Sepolia
- Address: `0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89`
- Status: Processing cross-chain transfers

✅ **Ethereum WrappedToken**: Deployed and verified on Sepolia
- Address: `0xDA9b99B67da148125106208D9A25E642eeF5Bf1c`
- Status: Minting wUSDC tokens for recipients

**View live transactions:**
- [Sepolia Etherscan - BridgeReceiver](https://sepolia.etherscan.io/address/0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89)
- [Sepolia Etherscan - WrappedToken](https://sepolia.etherscan.io/address/0xDA9b99B67da148125106208D9A25E642eeF5Bf1c)

## 📚 Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Blockchains**: Midnight Network, Ethereum (Sepolia)
- **ZK Framework**: Circom, snarkjs, Groth16
- **Smart Contracts**: Compact (Midnight), Solidity (Ethereum)
- **Wallets**: Lace Wallet, MetaMask

## 🤝 Contributing

This project was built for the Midnight Summit Hackathon. Contributions welcome!

## 📄 License

MIT License

## 🙏 Acknowledgments

- Midnight Network for privacy infrastructure
- Circom for ZK circuit framework
- OpenZeppelin for secure contract patterns

---

**🌉 ShadowBridge: Private Payments. Public Trust.**
