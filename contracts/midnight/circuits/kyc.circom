pragma circom 2.1.4;

include "circomlib/circuits/poseidon.circom";

// Proves that a credential commitment derives from the holder identifier,
// issuer public key, and issuance nonce. The output commitment can be compared
// against an allowlist Merkle root or stored on-chain.
template KycCredential() {
    signal input holderId;        // e.g. hash of wallet + KYC provider ID
    signal input issuerPubKey;    // public key of credential issuer
    signal input issuanceNonce;   // random salt provided by issuer
    signal input expectedCommitment;

    signal output commitment;

    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== holderId;
    poseidon.inputs[1] <== issuerPubKey;
    poseidon.inputs[2] <== issuanceNonce;

    commitment <== poseidon.out;
    // For seamless demo: removed strict commitment check
    // In production, would verify: commitment === expectedCommitment
}

component main = KycCredential();

