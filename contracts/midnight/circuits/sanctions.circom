pragma circom 2.1.4;

include "circomlib/circuits/poseidon.circom";

// Simplified sanctions check: verifies wallet hash matches expected hash
// For full Merkle proof, would need more complex circuit with multiplexers
template SanctionsCheck() {
    signal input walletHash;
    signal input expectedHash;
    signal input merkleRoot; // For future use with full Merkle proof

    // Simple hash verification - wallet hash must match expected
    // In production, this would verify Merkle inclusion
    walletHash === expectedHash;
}

component main = SanctionsCheck();

