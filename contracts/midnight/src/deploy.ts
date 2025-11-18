import { config } from "dotenv";
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { type Wallet } from "@midnight-ntwrk/wallet-api";
import { deployContract, type DeployContractOptionsBase } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  NetworkId,
  setNetworkId,
  getZswapNetworkId,
  getLedgerNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { createBalancedTx } from "@midnight-ntwrk/midnight-js-types";
import { nativeToken, Transaction } from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import { WebSocket } from "ws";
import { randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
import * as Rx from "rxjs";

// Load .env file
config({ path: path.join(process.cwd(), ".env") });

// Fix WebSocket for Node.js environment
// @ts-ignore
globalThis.WebSocket = WebSocket;

setNetworkId(NetworkId.TestNet);

const TESTNET_CONFIG = {
  indexer: "https://indexer.testnet-02.midnight.network/api/v1/graphql",
  indexerWS: "wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws",
  node: "https://rpc.testnet-02.midnight.network",
  proofServer: "http://127.0.0.1:6300",
};

const waitForFunds = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state) => {
        if (state.syncProgress) {
          console.log(
            `Sync progress: synced=${state.syncProgress.synced}, sourceGap=${state.syncProgress.lag.sourceGap}, applyGap=${state.syncProgress.lag.applyGap}`
          );
        }
      }),
      Rx.filter((state) => state.syncProgress?.synced === true),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n),
      Rx.tap((balance) => console.log(`Wallet funded with balance: ${balance}`))
    )
  );

const zeroBytes32 = () => new Uint8Array(32);

const hexToBytes = (hex: string): Uint8Array => {
  let normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  // Pad with leading zero if 63 characters (common mistake)
  if (normalized.length === 63) {
    normalized = "0" + normalized;
  }
  if (normalized.length !== 64) {
    throw new Error(`Expected 32-byte hex string (64 chars), got ${normalized.length} characters`);
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

async function main() {
  console.log("ShadowBridge PaymentProcessor Deployment\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const choice = await rl.question("Do you have a wallet seed? (y/n): ");

    let walletSeed: string;
    if (choice.toLowerCase().startsWith("y")) {
      walletSeed = await rl.question("Enter your 64-character seed: ");
    } else {
      const seedBytes = randomBytes(32);
      walletSeed = Array.from(seedBytes, (b) => b.toString(16).padStart(2, "0")).join(
        ""
      );
      console.log(`\nSAVE THIS SEED: ${walletSeed}\n`);
    }

    console.log("Building wallet...");
    const wallet = await WalletBuilder.buildFromSeed(
      TESTNET_CONFIG.indexer,
      TESTNET_CONFIG.indexerWS,
      TESTNET_CONFIG.proofServer,
      TESTNET_CONFIG.node,
      walletSeed,
      getZswapNetworkId(),
      "info"
    );

    wallet.start();
    const state = await Rx.firstValueFrom(wallet.state());

    console.log(`Your wallet address is: ${state.address}`);

    let balance = state.balances[nativeToken()] ?? 0n;
    if (balance === 0n) {
      console.log("Wallet balance is 0. Visit https://midnight.network/test-faucet");
      console.log("Waiting for tDUST...");
      balance = await waitForFunds(wallet);
    }

    console.log(`Balance: ${balance}`);

    const contractRoot = path.join(process.cwd(), "build", "payment_processor");
    const contractModulePath = path.join(contractRoot, "contract", "index.cjs");

    if (!fs.existsSync(contractModulePath)) {
      console.error("Contract artifacts not found! Run: npm run compile");
      process.exit(1);
    }

    console.log("Loading contract artifacts...");
    const ContractModule = await import(contractModulePath);

    const emptyProof = () => new Uint8Array();

    const contractInstance = new ContractModule.Contract({
      kycProof: emptyProof,
      amountProof: emptyProof,
      sanctionsProof: emptyProof,
      relayerKey: zeroBytes32,
      senderCommitWitness: zeroBytes32,
      recipientCommitWitness: zeroBytes32,
      amountCommitWitness: zeroBytes32,
    });

    const walletState = await Rx.firstValueFrom(wallet.state());

    const walletProvider = {
      coinPublicKey: walletState.coinPublicKey,
      encryptionPublicKey: walletState.encryptionPublicKey,
      balanceTx(tx: any, newCoins: any) {
        return wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(
              tx.serialize(getLedgerNetworkId()),
              getZswapNetworkId()
            ),
            newCoins
          )
          .then((balancedTx) => wallet.proveTransaction(balancedTx))
          .then((zswapTx) =>
            Transaction.deserialize(
              zswapTx.serialize(getZswapNetworkId()),
              getLedgerNetworkId()
            )
          )
          .then(createBalancedTx);
      },
      submitTx(tx: any) {
        return wallet.submitTransaction(tx);
      },
    };

    const adminPk =
      process.env.PAYMENT_PROCESSOR_ADMIN_PK !== undefined
        ? hexToBytes(process.env.PAYMENT_PROCESSOR_ADMIN_PK)
        : (() => {
            const rawPk = walletState.coinPublicKey as unknown;
            if (rawPk instanceof Uint8Array) {
              return rawPk;
            }
            if (typeof rawPk === "string") {
              return hexToBytes(rawPk);
            }
            if (Array.isArray(rawPk)) {
              return Uint8Array.from(rawPk);
            }
            throw new Error("Unable to derive admin public key");
          })();

    const minUsdArg =
      process.env.PAYMENT_PROCESSOR_MIN_AMOUNT !== undefined
        ? BigInt(process.env.PAYMENT_PROCESSOR_MIN_AMOUNT)
        : 100n;
    const maxUsdArg =
      process.env.PAYMENT_PROCESSOR_MAX_AMOUNT !== undefined
        ? BigInt(process.env.PAYMENT_PROCESSOR_MAX_AMOUNT)
        : 1000000n;
    const sanctionsRoot =
      process.env.PAYMENT_PROCESSOR_SANCTIONS_ROOT !== undefined
        ? hexToBytes(process.env.PAYMENT_PROCESSOR_SANCTIONS_ROOT)
        : zeroBytes32();

    console.log("Configuring providers...");
    const providers = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: "payment-processor-state",
      }),
      publicDataProvider: indexerPublicDataProvider(
        TESTNET_CONFIG.indexer,
        TESTNET_CONFIG.indexerWS
      ),
      zkConfigProvider: new NodeZkConfigProvider(contractRoot),
      proofProvider: httpClientProofProvider(TESTNET_CONFIG.proofServer),
      walletProvider,
      midnightProvider: walletProvider,
    };

    console.log("Deploying contract (30-60 seconds)...");
    const deployOptions: any = {
      contract: contractInstance,
      args: [adminPk, minUsdArg, maxUsdArg, sanctionsRoot],
    };
    const deployed = await deployContract(providers as any, deployOptions as any);

    const contractAddress = deployed.deployTxData.public.contractAddress;

    console.log("\nDEPLOYED!");
    console.log(`Contract Address: ${contractAddress}\n`);

    fs.writeFileSync(
      "deployment.json",
      JSON.stringify(
        {
          contractAddress,
          deployedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    console.log("Saved deployment details to deployment.json");

    await wallet.close();
  } catch (error) {
    console.error("Deployment failed:", error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);

