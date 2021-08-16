import { expect, use } from "chai";
import { Contract } from "ethers";
import { deployContract, solidity } from "ethereum-waffle";
import { evmChai } from "@acala-network/bodhi/evmChai";
import BasicToken from "../build/BasicToken.json";
import { TestAccountSigningKey, TestProvider, Signer } from "@acala-network/bodhi";
import { WsProvider } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";

use(solidity)
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

const testPairs = createTestPairs();

describe("BasicToken", () => {
  let wallet: Signer;
  let walletTo: Signer;
  let emptyWallet: Signer;
  let token: Contract;

  before(async () => {
    [wallet, walletTo, emptyWallet] = await provider.getWallets();
    token = await deployContract(wallet, BasicToken, [1000]);
  });

  after(async () => {
    provider.api.disconnect();
  });

  it("Assigns initial balance", async () => {
    expect(await token.balanceOf(await wallet.getAddress())).to.equal(1000);
  });

  it("Transfer adds amount to destination account", async () => {
    await token.transfer(await walletTo.getAddress(), 7);
    expect(await token.balanceOf(await walletTo.getAddress())).to.equal(7);
  });

  it("Transfer emits event", async () => {
    await expect(token.transfer(await walletTo.getAddress(), 7))
      .to.emit(token, "Transfer")
      .withArgs(await wallet.getAddress(), await walletTo.getAddress(), 7);
  });

  it("Can not transfer above the amount", async () => {
    await expect(token.transfer(await walletTo.getAddress(), 1007)).to.be
      .reverted;
  });

  it("Can not transfer from empty account", async () => {
    await provider.api.tx.evm.deploy(token.address).signAndSend(testPairs.alice.address);

    const tokenFromOtherWallet = token.connect(emptyWallet);
    await expect(tokenFromOtherWallet.transfer(await wallet.getAddress(), 1)).to
      .be.reverted;
  });
});
