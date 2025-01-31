import { TestProvider, Signer, TestAccountSigningKey } from "@acala-network/bodhi";
import { evmChai } from "@acala-network/bodhi/evmChai";
import { WsProvider } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";
import { expect, use } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import { Contract, BigNumber } from "ethers";
import Dex from "../build/Dex.json";
import ADDRESS from "@acala-network/contracts/utils/Address";

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

describe("Dex", () => {
  let wallet: Signer;
  let dex: Contract;

  before(async () => {
    [wallet] = await provider.getWallets();
    dex = await deployContract(wallet as any, Dex);
  });

  after(async () => {
    provider.api.disconnect()
  });

  it("getLiquidityPool works", async () => {
    expect(await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD)).to.be.ok;
  });

  it("getLiquidityPool should not works", async () => {
    await expect(
      dex.getLiquidityPool(ADDRESS.ACA, "0x0000000000000000000001000000000000000000")
    ).to.be.reverted;
  });

  it("getLiquidityTokenAddress works", async () => {
    expect(await dex.getLiquidityTokenAddress(ADDRESS.ACA, ADDRESS.AUSD)).to.equal(ADDRESS.LP_ACA_AUSD);
  });

  it("getLiquidityTokenAddress should not works", async () => {
    await expect(
      dex.getLiquidityTokenAddress(ADDRESS.ACA, "0x0000000000000000000001000000000000000000")
    ).to.be.reverted;
  });

  it("getSwapTargetAmount works", async () => {
    expect(await dex.getSwapTargetAmount([ADDRESS.ACA, ADDRESS.AUSD], 1000)).to.be.ok;
    expect(await dex.getSwapTargetAmount([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.DOT], 1000)).to.be.ok;
  });

  it("getSwapTargetAmount should not works", async () => {
    await expect(dex.getSwapTargetAmount([ADDRESS.ACA], 1000)).to.be.revertedWith("token path over the limit");
    await expect(dex.getSwapTargetAmount([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.DOT, ADDRESS.RENBTC], 1000)).to.be.revertedWith("token path over the limit");
    await expect(
      dex.getSwapTargetAmount([ADDRESS.ACA, "0x0000000000000000000001000000000000000000"], 1000)
    ).to.be.reverted;
  });

  it("getSwapSupplyAmount works", async () => {
    expect(await dex.getSwapSupplyAmount([ADDRESS.ACA, ADDRESS.AUSD], 1000)).to.be.ok;
    expect(await dex.getSwapSupplyAmount([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.DOT], 1000)).to.be.ok;
  });

  it("getSwapSupplyAmount should not works", async () => {
    await expect(dex.getSwapSupplyAmount([ADDRESS.ACA], 1000)).to.be.revertedWith("token path over the limit");
    await expect(dex.getSwapSupplyAmount([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.DOT, ADDRESS.RENBTC], 1000)).to.be.revertedWith("token path over the limit");
    await expect(
      dex.getSwapSupplyAmount([ADDRESS.ACA, "0x0000000000000000000001000000000000000000"], 1000)
    ).to.be.reverted;
  });

  it("swapWithExactSupply works", async () => {
    let pool_0 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect(await dex.swapWithExactSupply([ADDRESS.ACA, ADDRESS.AUSD], 1000, 1, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;

    let pool_1 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect((pool_1[0] - pool_0[0])).to.equal(1000);

    let pool_2 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect(await dex.swapWithExactSupply([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.ACA], 1000, 1, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;
    let pool_3 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    //expect((pool_3[0] - pool_2[0])).to.equal(4);
    //expect((pool_3[0] - pool_2[0])).to.equal(5);
  });

  it("swapWithExactSupply should not works", async () => {
    await expect(dex.swapWithExactSupply([ADDRESS.ACA], 1000, 1)).to.be.revertedWith("token path over the limit");
    await expect(dex.swapWithExactSupply([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.ACA, ADDRESS.RENBTC], 1000, 1)).to.be.revertedWith("token path over the limit");
    await expect(
      dex.swapWithExactSupply([ADDRESS.ACA, "0x0000000000000000000001000000000000000000"], 1000, 1)
    ).to.be.reverted;
  });

  it("swapWithExactTarget works", async () => {
    let pool_0 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect(await dex.swapWithExactTarget([ADDRESS.ACA, ADDRESS.AUSD], 1, 1000, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;

    let pool_1 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect((pool_1[0] - pool_0[0])).to.equal(1);

    let pool_2 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect(await dex.swapWithExactTarget([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.ACA], 1, 1000, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;
    let pool_3 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect((pool_3[0] - pool_2[0])).to.equal(1);
  });

  it("swapWithExactTarget should not works", async () => {
    await expect(dex.swapWithExactTarget([ADDRESS.ACA], 1, 1000)).to.be.revertedWith("token path over the limit");
    await expect(dex.swapWithExactTarget([ADDRESS.ACA, ADDRESS.AUSD, ADDRESS.ACA, ADDRESS.RENBTC], 1, 1000)).to.be.revertedWith("token path over the limit");
    await expect(
      dex.swapWithExactTarget([ADDRESS.ACA, "0x0000000000000000000001000000000000000000"], 1, 1000)
    ).to.be.reverted;
  });

  it("addLiquidity and removeLiquidity works", async () => {
    let pool_0 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect(await dex.swapWithExactTarget([ADDRESS.ACA, ADDRESS.AUSD], 1000, 1000, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;

    let pool_1 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect((pool_1[1] - pool_0[1])).to.equal(-1000);

    expect(await dex.addLiquidity(ADDRESS.ACA, ADDRESS.AUSD, 100, 100, 0, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;

    let pool_2 = await dex.getLiquidityPool(ADDRESS.ACA, ADDRESS.AUSD);
    expect((pool_2[1] - pool_1[1])).to.equal(100);

    expect(await dex.removeLiquidity(ADDRESS.ACA, ADDRESS.AUSD, 100, 0, 0, { value: 5000, gasLimit: 2_000_000 })).to.be.ok;
  });

  it("addLiquidity should not works", async () => {
    await expect(
      dex.addLiquidity(ADDRESS.ACA, "0x0000000000000000000001000000000000000000", 1, 1000, 0)
    ).to.be.reverted;
  });

  it("removeLiquidity should not works", async () => {
    await expect(
      dex.addLiquidity(ADDRESS.ACA, "0x0000000000000000000001000000000000000000", 1, 1000, 0)
    ).to.be.reverted;
  });
});
