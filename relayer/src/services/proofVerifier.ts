import { ProofBundle } from '../types';
import { logger } from '../logger';
import { sleep } from '../utils/sleep';

const REQUIRED_FIELDS: Array<keyof ProofBundle> = [
  'kycProof',
  'amountProof',
  'sanctionsProof',
];

export class ProofVerifier {
  constructor(private readonly maxLatencyMs = 2_000) {}

  async verify(proofs: ProofBundle): Promise<void> {
    REQUIRED_FIELDS.forEach((field) => {
      if (!proofs[field] || proofs[field].length < 8) {
        throw new Error(`Invalid ${field} payload`);
      }
      if (!proofs[field].startsWith('0x')) {
        throw new Error(`${field} must be a hex string`);
      }
    });

    const latency = Math.floor(Math.random() * this.maxLatencyMs);
    logger.debug('Verifying zero-knowledge proofs', { latency });
    await sleep(latency);
    logger.debug('Zero-knowledge proofs verified');
  }
}

