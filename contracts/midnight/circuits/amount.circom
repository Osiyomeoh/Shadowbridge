pragma circom 2.1.4;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";

// Proves that a private amount lies within [minAmount, maxAmount] USD
// and outputs a Poseidon commitment that the relayer/Midnight contract
// can use for deterministic hashing.
template AmountRange(minAmount, maxAmount) {
    assert(minAmount < maxAmount);

    signal input amount;      // denominated in cents
    signal input blinding;    // random nonce for commitment

    signal output commitment;

    // amount >= minAmount  <=> minAmount < amount + 1
    signal amountPlusOne;
    amountPlusOne <== amount + 1;

    component geMin = LessThan(64);
    geMin.in[0] <== minAmount;
    geMin.in[1] <== amountPlusOne;
    geMin.out === 1;

    // amount <= maxAmount  <=> amount < maxAmount + 1
    signal maxPlusOne;
    maxPlusOne <== maxAmount + 1;

    component leMax = LessThan(64);
    leMax.in[0] <== amount;
    leMax.in[1] <== maxPlusOne;
    leMax.out === 1;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== amount;
    poseidon.inputs[1] <== blinding;

    commitment <== poseidon.out;
}

component main = AmountRange(100, 1000000);

