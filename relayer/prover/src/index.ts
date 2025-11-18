import express from 'express';
import cors from 'cors';
import { groth16 } from 'snarkjs';
import fs from 'fs';
import path from 'path';
import { config } from './config';

type CircuitName = 'kyc' | 'amount' | 'sanctions';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const ensureArtifacts = (circuit: CircuitName) => {
  const { wasm, zkey } = config.circuits[circuit];
  if (!fs.existsSync(wasm)) {
    throw new Error(`Missing WASM for circuit ${circuit}: ${wasm}`);
  }
  if (!fs.existsSync(zkey)) {
    throw new Error(`Missing zkey for circuit ${circuit}: ${zkey}`);
  }
  return { wasm, zkey };
};

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    circuitsPath: config.circuits.root,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.post('/prove/:circuit', async (req, res) => {
  const circuit = req.params.circuit as CircuitName;
  if (!['kyc', 'amount', 'sanctions'].includes(circuit)) {
    return res.status(404).json({ error: 'Unknown circuit' });
  }

  try {
    const { wasm, zkey } = ensureArtifacts(circuit);
    
    // Handle both { inputs: {...} } and direct input formats
    let witnessInput = req.body.inputs || req.body;
    if (!witnessInput || typeof witnessInput !== 'object') {
      throw new Error('Witness input must be a JSON object');
    }

    // For KYC circuit: set default expectedCommitment if missing (circuit no longer strictly validates it)
    if (circuit === 'kyc' && !witnessInput.expectedCommitment) {
      witnessInput.expectedCommitment = '0'; // Any value works now
    }

    console.log(`Generating proof for ${circuit} with inputs:`, Object.keys(witnessInput));

    const { proof, publicSignals } = await groth16.fullProve(
      witnessInput,
      wasm,
      zkey
    );

    // Serialize proof to hex string for seamless integration
    const proofHex = Buffer.from(JSON.stringify(proof)).toString('hex');
    
    res.json({
      circuit,
      proof: `0x${proofHex}`,
      publicSignals,
      proofObj: proof, // Also include object format for debugging
    });
  } catch (error) {
    const errorMessage = (error as Error).message || 'Proof generation failed';
    console.error(`Proof generation error for ${circuit}:`, errorMessage);
    res.status(400).json({
      error: errorMessage,
      circuit,
    });
  }
});

app.post('/verify/:circuit', async (req, res) => {
  const circuit = req.params.circuit as CircuitName;
  if (!['kyc', 'amount', 'sanctions'].includes(circuit)) {
    return res.status(404).json({ error: 'Unknown circuit' });
  }

  try {
    const verificationKeyPath = path.join(
      config.circuits.root,
      `${circuit}_verification_key.json`
    );
    if (!fs.existsSync(verificationKeyPath)) {
      throw new Error(`Missing verification key: ${verificationKeyPath}`);
    }

    const { proof, publicSignals } = req.body;
    if (!proof || !publicSignals) {
      throw new Error('Request must include proof and publicSignals');
    }

    const vk = JSON.parse(fs.readFileSync(verificationKeyPath, 'utf-8'));
    const result = await groth16.verify(vk, publicSignals, proof);
    res.json({ circuit, valid: result });
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message || 'Verification failed',
    });
  }
});

app.listen(config.port, () => {
  console.log(
    `🔐 ShadowBridge prover listening on port ${config.port}, circuits root ${config.circuits.root}`
  );
});

