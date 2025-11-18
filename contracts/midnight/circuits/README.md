# Midnight Circuits

This package contains the zero-knowledge circuits that back the Midnight `PaymentProcessor`. They are built with Circom 2.x and Groth16 proving via `snarkjs`.

## Circuits

| Circuit | Purpose |
|---------|---------|
| `kyc.circom` | Proves a user holds a credential signed by an approved issuer without revealing the credential contents. |
| `amount.circom` | Commits to a private transfer amount and proves it lies within the compliant range (USD 1 – 10,000). |
| `sanctions.circom` | Produces a Merkle inclusion proof that the sender/recipient appears in the sanctioned-free allowlist. |

## Prerequisites

- Circom 2.1.4+
- Node.js 18+
- Powers of Tau file (e.g. `powersOfTau28_hez_final_12.ptau`)

Install dependencies:

```bash
cd contracts/midnight/circuits
npm install
```

## Build, Setup, Prove

```bash
# Compile all circuits to R1CS + WASM
npm run build

# Run Groth16 setup for each circuit (needs PTAU file)
export PTAU=~/ptau/powersOfTau28_hez_final_12.ptau
snarkjs groth16 setup build/kyc.r1cs $PTAU build/kyc_0000.zkey
# repeat for amount + sanctions or use npm run setup

# Generate a witness for a circuit
node build/kyc_js/generate_witness.js build/kyc_js/kyc.wasm input_kyc.json build/kyc.wtns

# Prove & verify
npm run prove:kyc
npm run verify:kyc
```

Each circuit outputs both the witness commitment (used by the Midnight contract) and the public signals needed by the relayer/Sepolia bridge.

