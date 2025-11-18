import {
  Contract,
  JsonRpcProvider,
  TransactionReceipt,
  Wallet,
  parseUnits,
} from 'ethers';
import { logger } from '../logger';
import { TransferRecord } from '../types';

const BRIDGE_RECEIVER_ABI = [
  'function processCrossChainTransfer(address recipient,uint256 amount,bytes32 messageHash,bytes proof) external',
  'function getStats() view returns (uint256 totalTransactions,uint256 totalVolume)',
];

export interface BridgeClientConfig {
  rpcUrl: string;
  bridgeAddress: string;
  privateKey: string;
  decimals: number;
}

export class BridgeClient {
  private provider?: JsonRpcProvider;
  private signer?: Wallet;
  private contract?: Contract;

  constructor(private readonly config: BridgeClientConfig) {
    const { rpcUrl, bridgeAddress, privateKey } = config;
    if (rpcUrl && bridgeAddress && privateKey) {
      this.provider = new JsonRpcProvider(rpcUrl);
      this.signer = new Wallet(privateKey, this.provider);
      this.contract = new Contract(bridgeAddress, BRIDGE_RECEIVER_ABI, this.signer);
      logger.info('Bridge client ready', {
        bridgeAddress,
        network: rpcUrl,
      });
    } else {
      logger.warn(
        'Bridge client not fully configured. Set ETHEREUM_RPC_URL, ETHEREUM_BRIDGE_ADDRESS, and ETHEREUM_PRIVATE_KEY to enable submissions.'
      );
    }
  }

  isReady() {
    return Boolean(this.contract);
  }

  async submitTransfer(transfer: TransferRecord): Promise<TransactionReceipt> {
    if (!this.contract || !this.signer) {
      throw new Error('Bridge client not configured');
    }

    const proofBytes = transfer.proofs.amountProof;

    logger.info('Submitting transfer to BridgeReceiver', {
      recipient: transfer.recipient,
      amountUsd: transfer.amountUsd,
      messageHash: transfer.messageHash,
    });

    const amount = transfer.amountWei ?? parseUnits(
      transfer.amountUsd.toString(),
      this.config.decimals
    );

    const txResponse = await this.contract.processCrossChainTransfer(
      transfer.recipient,
      amount,
      transfer.messageHash,
      proofBytes
    );

    logger.info('BridgeReceiver submission broadcast', {
      txHash: txResponse.hash,
    });

    const receipt = await txResponse.wait();
    logger.info('BridgeReceiver submission confirmed', {
      txHash: receipt?.hash,
      blockNumber: receipt?.blockNumber,
    });

    return receipt;
  }
}

