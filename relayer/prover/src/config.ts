import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const circuitsRoot =
  process.env.CIRCUITS_BUILD_DIR ||
  path.resolve(__dirname, '../../../contracts/midnight/circuits/build');

export const config = {
  port: parseInt(process.env.PROVER_PORT || '4001', 10),
  circuits: {
    root: circuitsRoot,
    kyc: {
      wasm: path.join(circuitsRoot, 'kyc_js/kyc.wasm'),
      zkey: path.join(circuitsRoot, 'kyc_final.zkey'),
    },
    amount: {
      wasm: path.join(circuitsRoot, 'amount_js/amount.wasm'),
      zkey: path.join(circuitsRoot, 'amount_final.zkey'),
    },
    sanctions: {
      wasm: path.join(circuitsRoot, 'sanctions_js/sanctions.wasm'),
      zkey: path.join(circuitsRoot, 'sanctions_final.zkey'),
    },
  },
};

