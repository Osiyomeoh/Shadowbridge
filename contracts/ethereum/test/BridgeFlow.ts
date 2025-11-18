import { expect } from "chai";
import { ethers } from "hardhat";

const parseUSDC = (amount: string) => ethers.parseUnits(amount, 18);

describe("ShadowBridge local flow", () => {
  async function deployFixture() {
    const [deployer, relayer, recipient, other] = await ethers.getSigners();

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

    return { deployer, relayer, recipient, other, wrappedToken, bridgeReceiver };
  }

  it("moves funds and updates state when relayer submits transfer", async () => {
    const { relayer, recipient, wrappedToken, bridgeReceiver } =
      await deployFixture();

    const amount = parseUSDC("100");
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("message-1"));

    await expect(
      bridgeReceiver
        .connect(relayer)
        .processCrossChainTransfer(recipient.address, amount, messageHash, "0x")
    ).to.emit(bridgeReceiver, "TokensMinted");

    expect(await wrappedToken.balanceOf(recipient.address)).to.equal(amount);

    const stats = await bridgeReceiver.getStats();
    expect(stats[0]).to.equal(1n);
    expect(stats[1]).to.equal(amount);
    expect(await bridgeReceiver.processedMessages(messageHash)).to.equal(true);
  });

  it("rejects submissions from non-relayers", async () => {
    const { recipient, bridgeReceiver, other } = await deployFixture();
    const amount = parseUSDC("50");
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("message-2"));

    await expect(
      bridgeReceiver
        .connect(other)
        .processCrossChainTransfer(recipient.address, amount, messageHash, "0x")
    ).to.be.revertedWith("Not relayer");
  });

  it("prevents double processing of the same message", async () => {
    const { relayer, recipient, bridgeReceiver } = await deployFixture();
    const amount = parseUSDC("75");
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("message-3"));

    await bridgeReceiver
      .connect(relayer)
      .processCrossChainTransfer(recipient.address, amount, messageHash, "0x");

    await expect(
      bridgeReceiver
        .connect(relayer)
        .processCrossChainTransfer(recipient.address, amount, messageHash, "0x")
    ).to.be.revertedWith("Already processed");
  });
});

