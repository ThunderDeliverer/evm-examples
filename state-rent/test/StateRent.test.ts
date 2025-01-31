import { TestProvider, Signer, TestAccountSigningKey } from "@acala-network/bodhi";
import { evmChai } from "@acala-network/bodhi/evmChai";
import { WsProvider } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import { Contract, BigNumber } from "ethers";
import StateRent from "../build/StateRent.json";
import ADDRESS from "@acala-network/contracts/utils/Address";

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

const testPairs = createTestPairs();

const transfer = async (contract: string, new_maintainer: string) => {
  return new Promise((resolve) => {
    provider.api.tx.evm.transferMaintainer(contract, new_maintainer).signAndSend(testPairs.alice.address, (result) => {
      if (result.status.isInBlock) {
        resolve(undefined);
      }
    });
  });
}

describe("StateRent", () => {
  let wallet: Signer;
  let walletTo: Signer;
  let stateRent: Contract;

  before(async () => {
    [wallet, walletTo] = await provider.getWallets();
    stateRent = await deployContract(wallet as any, StateRent);
  });

  after(async () => {
    provider.api.disconnect()
  });

  it("stateRent works", async () => {
    expect(
      await stateRent.newContractExtraBytes()
    ).to.equal(0);

    expect(
      await stateRent.storageDepositPerByte()
    ).to.equal(0);

    expect(
      await stateRent.maintainerOf(stateRent.address)
    ).to.equal(await wallet.getAddress());

    expect(
      await stateRent.developerDeposit()
    ).to.equal(0);

    expect(
      await stateRent.deploymentFee()
    ).to.equal(0);

    // The contract created by the user cannot be transferred through the contract,
    // only through the evm dispatch call `transfer_maintainer`.
    await expect(stateRent.transferMaintainer(stateRent.address, await walletTo.getAddress())).to
      .be.reverted;

    await transfer(stateRent.address, await walletTo.getAddress());

    expect(
      await stateRent.maintainerOf(stateRent.address)
    ).to.equal(await walletTo.getAddress());
  });
});
