# ShadowBridge Relayer

The relayer ingests transfer intents (from Midnight events or the demo API), verifies their zero-knowledge proofs, and submits them to the `BridgeReceiver` contract on Ethereum testnet.

## Prerequisites

- Node.js 18+
- Environment variables in `.env` (see `.env.example`)
  - `ETHEREUM_RPC_URL` – Sepolia RPC endpoint
  - `ETHEREUM_BRIDGE_ADDRESS` – deployed `BridgeReceiver` address
  - `ETHEREUM_PRIVATE_KEY` – relayer key with wUSDC balance/permissions

## Scripts

```bash
npm install
npm run dev   # ts-node-dev watch mode
npm run build # emits dist/
npm start     # runs compiled JS
```

## REST API

| Method | Path                   | Description                                  |
|--------|------------------------|----------------------------------------------|
| GET    | `/health`              | Service status + queue depth                 |
| GET    | `/stats`               | Transfer aggregates (volume, states)         |
| POST   | `/transfers`           | Queue a transfer created by the frontend     |
| GET    | `/transfers`           | List transfers (most recent first)           |
| GET    | `/transfers/:id`       | Inspect a specific transfer                  |
| POST   | `/simulate/midnight`   | Inject a mocked Midnight contract event      |

### Example Request

```bash
curl -X POST http://localhost:3001/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "0xSender",
    "recipient": "0xRecipient",
    "destinationChain": "ethereum-sepolia",
    "amountUsd": 250,
    "proofs": {
      "kycProof": "0xabc123",
      "amountProof": "0xabc124",
      "sanctionsProof": "0xabc125"
    }
  }'
```

The relayer responds with a `transferId` and asynchronously:

1. Validates proofs (`ProofVerifier`)
2. Submits to `BridgeReceiver` via `BridgeClient`
3. Updates status through `QUEUED → PROOF_VERIFYING → PROOF_VERIFIED → SUBMITTING → SETTLED/FAILED`

Use `GET /transfers/:id` to follow progress or `GET /stats` for aggregate dashboards.

