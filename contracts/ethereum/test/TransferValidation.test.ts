import { expect } from "chai";
import { ethers } from "hardhat";

const parseUSDC = (amount: string) => ethers.parseUnits(amount, 18);

describe("Transfer Validation", () => {
  async function deployFixture() {
    const [deployer, relayer, recipient] = await ethers.getSigners();

    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = await WrappedToken.deploy(deployer.address);
    await wrappedToken.waitForDeployment();

    const BridgeReceiver = await ethers.getContractFactory("BridgeReceiver");
    const bridgeReceiver = await BridgeReceiver.deploy(
      await wrappedToken.getAddress(),
      relayer.address,
      deployer.address
    );
    await bridgeReceiver.waitForDeployment();

    const liquidity = parseUSDC("1000");
    await wrappedToken.mint(deployer.address, liquidity);
    await wrappedToken.transfer(await bridgeReceiver.getAddress(), liquidity);
    await wrappedToken.setBridge(await bridgeReceiver.getAddress());

    return { deployer, relayer, recipient, wrappedToken, bridgeReceiver };
  }

  it("should reject zero amount transfers", async () => {
    const { relayer, recipient, bridgeReceiver } = await deployFixture();
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("zero-amount"));

    await expect(
      bridgeReceiver
        .connect(relayer)
        .processCrossChainTransfer(recipient.address, 0, messageHash, "0x")
    ).to.be.reverted;
  });

  it("should reject transfers to zero address", async () => {
    const { relayer, bridgeReceiver } = await deployFixture();
    const amount = parseUSDC("100");
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("zero-recipient"));

    await expect(
      bridgeReceiver
        .connect(relayer)
        .processCrossChainTransfer(ethers.ZeroAddress, amount, messageHash, "0x")
    ).to.be.reverted;
  });

  it("should update stats correctly", async () => {
    const { relayer, recipient, bridgeReceiver } = await deployFixture();
    const amount1 = parseUSDC("100");
    const amount2 = parseUSDC("200");
    const messageHash1 = ethers.keccak256(ethers.toUtf8Bytes("tx-1"));
    const messageHash2 = ethers.keccak256(ethers.toUtf8Bytes("tx-2"));

    await bridgeReceiver
      .connect(relayer)
      .processCrossChainTransfer(recipient.address, amount1, messageHash1, "0x");

    await bridgeReceiver
      .connect(relayer)
      .processCrossChainTransfer(recipient.address, amount2, messageHash2, "0x");

    const stats = await bridgeReceiver.getStats();
    expect(stats[0]).to.equal(2n);
    expect(stats[1]).to.equal(amount1 + amount2);
  });

  it("should emit TokensMinted event", async () => {
    const { relayer, recipient, bridgeReceiver } = await deployFixture();
    const amount = parseUSDC("50");
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("event-test"));

    await expect(
      bridgeReceiver
        .connect(relayer)
        .processCrossChainTransfer(recipient.address, amount, messageHash, "0x")
    )
      .to.emit(bridgeReceiver, "TokensMinted")
      .withArgs(recipient.address, amount);
  });
});

