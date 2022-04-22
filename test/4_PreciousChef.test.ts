import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { PreciousChef, ERC20Mock } from "../typechain";
import { Ether, advanceBlock, advanceBlockTo } from "./utils";

describe("PreciousChef", () => {
  let deployer: SignerWithAddress;
  let lendAuction: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let preciousChef: PreciousChef;
  let precious: ERC20Mock;

  let preciousPerBlock = Ether(100);

  beforeEach(async () => {
    [deployer, lendAuction, alice, bob] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    precious = <ERC20Mock>await ERC20Mock.deploy();

    const PreciousChef = await ethers.getContractFactory("PreciousChef");
    preciousChef = <PreciousChef>(
      await upgrades.deployProxy(PreciousChef, [
        precious.address,
        preciousPerBlock,
        lendAuction.address,
      ])
    );
    await preciousChef.deployed();

    await precious.connect(deployer).mint(Ether(1000000));
    await precious.connect(deployer).transfer(preciousChef.address, Ether(1000000));
  });

  describe("add pool", () => {
    it("revert when not owner", async () => {
      await expect(preciousChef.connect(alice).addPool(100)).revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should add pool", async () => {
      await preciousChef.connect(deployer).addPool(100);
      const poolInfo = await preciousChef.poolInfo(0);
      expect(poolInfo.allocPoint).to.equal(100);
      expect(poolInfo.lastRewardBlock).to.not.equal(0);
      expect(poolInfo.accPreciousPerBoost).to.equal(0);
      expect(poolInfo.boostSupply).to.equal(0);
    });
  });

  describe("set pool", () => {
    it("revert when not owner", async () => {
      await expect(preciousChef.connect(alice).set(0, 101, false)).revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("revert when invalid pid", async () => {
      await expect(preciousChef.connect(deployer).set(1, 101, false)).revertedWith("Invalid pid");
    });

    it("should set pool", async () => {
      await preciousChef.connect(deployer).addPool(100);
      await preciousChef.connect(deployer).set(0, 101, false);
      const poolInfo = await preciousChef.poolInfo(0);
      expect(poolInfo.allocPoint).to.equal(101);
    });
  });

  describe("poolLength", () => {
    it("should return proper length", async () => {
      await preciousChef.connect(deployer).addPool(75); // main pool
      await preciousChef.connect(deployer).addPool(25); // reserve pool

      expect(await preciousChef.poolLength()).to.equal(2);
    });
  });

  describe("deposit", () => {
    beforeEach(async () => {
      await preciousChef.connect(deployer).addPool(75); // main pool
      await preciousChef.connect(deployer).addPool(25); // reserve pool
    });

    it("revert when not lendAuction", async () => {
      await expect(preciousChef.connect(alice).deposit(0, Ether(10), alice.address)).revertedWith(
        "Not lend auction"
      );
    });

    it("should deposit and update supply", async () => {
      await preciousChef.connect(lendAuction).deposit(0, Ether(10), alice.address);
      const poolInfo = await preciousChef.poolInfo(0);
      expect(poolInfo.boostSupply).to.equal(Ether(10));

      const userInfo = await preciousChef.userInfo(0, alice.address);
      expect(userInfo.boost).to.equal(Ether(10));
      expect(userInfo.rewardDebt).to.equal(0);
    });
  });

  describe("pending reward", () => {
    beforeEach(async () => {
      await preciousChef.connect(deployer).addPool(75); // main pool
      await preciousChef.connect(deployer).addPool(25); // reserve pool
    });

    it("should be equal expected", async () => {
      const log = await preciousChef.connect(lendAuction).deposit(0, Ether(10), alice.address);
      await advanceBlock();
      const log2 = await preciousChef.updatePool(0);
      let expected = preciousPerBlock
        .mul(log2.blockNumber! - log.blockNumber!)
        .div(4)
        .mul(3);

      const pending = await preciousChef.pendingPrecious(0, alice.address);
      expect(pending).to.equal(expected);
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      await preciousChef.connect(deployer).addPool(75); // main pool
      await preciousChef.connect(deployer).addPool(25); // reserve pool

      await preciousChef.connect(lendAuction).deposit(0, Ether(10), alice.address);
    });

    it("revert when not lend auction", async () => {
      await expect(preciousChef.connect(alice).withdraw(0, Ether(5), alice.address)).revertedWith(
        "Not lend auction"
      );
    });

    it("should withdraw and update supply", async () => {
      await preciousChef.connect(lendAuction).withdraw(0, Ether(5), alice.address);
      const poolInfo = await preciousChef.poolInfo(0);
      expect(poolInfo.boostSupply).to.equal(Ether(5));

      const userInfo = await preciousChef.userInfo(0, alice.address);
      expect(userInfo.boost).to.equal(Ether(5));
    });
  });

  describe("harvest", () => {
    beforeEach(async () => {
      await preciousChef.connect(deployer).addPool(50); // main pool
      await preciousChef.connect(deployer).addPool(50); // reserve pool
    });

    it("should harvest correct reward amount", async () => {
      let log = await preciousChef.connect(lendAuction).deposit(0, Ether(10), alice.address);
      await advanceBlockTo(20);
      let log2 = await preciousChef.connect(lendAuction).withdraw(0, Ether(10), alice.address);

      let expected = preciousPerBlock.mul(log2.blockNumber! - log.blockNumber!).div(2);
      expect((await preciousChef.userInfo(0, alice.address)).rewardDebt).to.equal("-" + expected);
      await preciousChef.connect(alice).harvest(0, alice.address);
      expect(await precious.balanceOf(alice.address)).to.equal(expected);
    });
  });
});
