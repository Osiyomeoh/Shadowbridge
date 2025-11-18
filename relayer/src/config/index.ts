import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  usdcDecimals: process.env.USDC_DECIMALS ? parseInt(process.env.USDC_DECIMALS, 10) : 18,
  minAmount: parseFloat(process.env.MIN_AMOUNT || '1'),
  maxAmount: parseFloat(process.env.MAX_AMOUNT || '10000'),
  feeBps: parseInt(process.env.FEE_BPS || '150', 10),
  
  midnight: {
    rpcUrl: process.env.MIDNIGHT_RPC_URL || '',
    indexerUrl: process.env.MIDNIGHT_INDEXER_URL || '',
    contractAddress: process.env.MIDNIGHT_CONTRACT_ADDRESS || '',
  },
  
  ethereum: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || '',
    bridgeAddress: process.env.ETHEREUM_BRIDGE_ADDRESS || '',
    privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
  },
};
