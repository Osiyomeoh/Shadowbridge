import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ShadowBridge contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy WrappedToken
  console.log("\n1. Deploying WrappedToken...");
  const WrappedToken = await ethers.getContractFactory("WrappedToken");
  const wrappedToken = await WrappedToken.deploy(deployer.address);
  await wrappedToken.waitForDeployment();
  const wrappedTokenAddress = await wrappedToken.getAddress();
  console.log("WrappedToken deployed to:", wrappedTokenAddress);

  // Deploy BridgeReceiver
  console.log("\n2. Deploying BridgeReceiver...");
  const BridgeReceiver = await ethers.getContractFactory("BridgeReceiver");
  const bridgeReceiver = await BridgeReceiver.deploy(
    wrappedTokenAddress,
    deployer.address,
    deployer.address
  );
  await bridgeReceiver.waitForDeployment();
  const bridgeReceiverAddress = await bridgeReceiver.getAddress();
  console.log("BridgeReceiver deployed to:", bridgeReceiverAddress);

  // Mint initial supply directly to bridge receiver
  console.log("\n3. Funding BridgeReceiver with initial liquidity...");
  const initialSupply = ethers.parseEther("1000000");
  await wrappedToken.mint(bridgeReceiverAddress, initialSupply);
  console.log("BridgeReceiver funded with:", ethers.formatEther(initialSupply), "tokens");

  // Set bridge after funding
  console.log("\n4. Setting bridge...");
  await wrappedToken.setBridge(bridgeReceiverAddress);
  console.log("Bridge set");

  console.log("\n=================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("=================================");
  console.log("WrappedToken:", wrappedTokenAddress);
  console.log("BridgeReceiver:", bridgeReceiverAddress);
  console.log("\nAdd to frontend/.env:");
  console.log(`VITE_ETHEREUM_BRIDGE_CONTRACT=${bridgeReceiverAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
