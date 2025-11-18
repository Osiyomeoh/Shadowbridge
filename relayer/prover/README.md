# ShadowBridge Prover Service

Generates Groth16 proofs for the Midnight circuits (`kyc`, `amount`, `sanctions`). Wraps `snarkjs` in a simple HTTP API so the frontend and relayer can request real zero-knowledge proofs with consistent artifacts.

## Prerequisites

- Circuits compiled + trusted setup completed (see `contracts/midnight/circuits`)
- `powersOfTau28_hez_final_12.ptau` available when running setup

## Install & Run

```bash
cd relayer/prover
npm install
cp ../.env.example .env # optional
npm run dev
```

Environment variables:

| Key | Description | Default |
|-----|-------------|---------|
| `PROVER_PORT` | Port for the HTTP server | `4001` |
| `CIRCUITS_BUILD_DIR` | Directory containing `*_js` and `*_final.zkey` files | `contracts/midnight/circuits/build` |

## API

### Health

```
GET /health
```

Returns service status, circuits path, uptime.

### Generate Proof

```
POST /prove/:circuit
```

Body: JSON witness inputs expected by the circuit (see each circuit’s documentation).

Response:

```json
{
  "circuit": "amount",
  "proof": { ... },
  "publicSignals": [ ... ]
}
```

### Verify Proof

```
POST /verify/:circuit
```

Body:

```json
{
  "proof": { ... },
  "publicSignals": [ ... ]
}
```

Response:

```json
{ "circuit": "amount", "valid": true }
```

Use this endpoint for integration tests or to double-check proofs returned from `/prove`.

