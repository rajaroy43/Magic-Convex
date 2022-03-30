import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { deployments, ethers, timeAndMine, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { TreasureFixture } from "./fixtures/TreasureFixture";
import { depositMagicInGuild } from "../utils/DepositMagicInGuild";
import {
  ONE_DAY_IN_SECONDS,
  ONE_MAGIC_BN,
  ONE_MONTH_IN_SECONDS,
  PRECISION,
  ONE_THOUSAND_MAGIC_BN,
  ONE_LEGION,
  ONE_TREAUSRE,
  TREASURE_TOKEN_IDS,
  LEGION_TOKEN_IDS,
} from "../utils/constants";
import { awaitTx } from "../utils/AwaitTx";
import {
  stakeLegion,
  stakeTreasures,
  unStakeLegion,
  unStakeTreasures,
} from "../utils/MagicNftStaking";
import { AtlasMine, MagicDepositor, Treasure, Legion } from "../typechain";

const { AddressZero } = ethers.constants;

describe("Local - MagicDepositor", () => {
  function checkAtlasDepositHasBeenInitialized(atlasDeposit: any) {
    expect(atlasDeposit.activationTimestamp).to.be.gt(0);
    expect(atlasDeposit.accumulatedMagic).to.be.gt(0);
    expect(atlasDeposit.mintedShares).to.be.equal(0);
    expect(atlasDeposit.exists).to.be.equal(true);
    expect(atlasDeposit.isActive).to.be.equal(false);
  }

  function checkAtlasDepositHasBeenActivated(atlasDeposit: any) {
    expect(atlasDeposit.exists).to.be.equal(true);
    expect(atlasDeposit.isActive).to.be.equal(true);
    expect(atlasDeposit.mintedShares).to.be.gt(0);
  }

  before(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  describe("depositFor()", () => {
    it("rejects zero inputs", async () => {
      const { alice, magicDepositor } = await TreasureFixture();

      await expect(magicDepositor.depositFor(0, alice.address)).to.be.revertedWith(
        "amount cannot be 0"
      );
      await expect(magicDepositor.depositFor(1, AddressZero)).to.be.revertedWith(
        "cannot deposit for 0x0"
      );
    });

    describe("when the first user deposit happens", () => {
      it("initializes the first deposit with the correct parameters", async () => {
        const { alice, bob, magicToken, magicDepositor } = await TreasureFixture();

        let _activationTimestamp: BigNumber;

        // First ever user deposit
        {
          await magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address);

          expect((await magicDepositor.atlasDeposits(0)).exists).to.be.equal(false); // Deposits should start at index 1

          const atlasDeposit = await magicDepositor.atlasDeposits(1);
          const { activationTimestamp, accumulatedMagic } = atlasDeposit;
          _activationTimestamp = activationTimestamp; // Save for later checks

          checkAtlasDepositHasBeenInitialized(atlasDeposit);
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN);
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC_BN);
          expect(await magicDepositor.getUserDepositedMagic(1, alice.address)).to.be.equal(
            ONE_MAGIC_BN
          );
        }

        // Secondary user deposit
        {
          await magicToken
            .connect(bob)
            .approve(magicDepositor.address, ethers.constants.MaxUint256);
          await magicDepositor.connect(bob).depositFor(ONE_MAGIC_BN.mul(2), bob.address);

          expect((await magicDepositor.atlasDeposits(2)).exists).to.be.equal(false);

          const atlasDeposit = await magicDepositor.atlasDeposits(1);
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } =
            atlasDeposit;

          expect(activationTimestamp).to.be.eq(_activationTimestamp);
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN.mul(3));
          expect(mintedShares).to.be.equal(0);
          expect(exists).to.be.equal(true);
          expect(isActive).to.be.equal(false);
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(
            ONE_MAGIC_BN.mul(3)
          );
        }

        // First deposit increment
        {
          await magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address);

          const atlasDeposit = await magicDepositor.atlasDeposits(1);
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } =
            atlasDeposit;

          expect(activationTimestamp).to.be.equal(_activationTimestamp);
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN.mul(4));
          expect(mintedShares).to.be.equal(0);
          expect(exists).to.be.equal(true);
          expect(isActive).to.be.equal(false);
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(
            ONE_MAGIC_BN.mul(4)
          );
        }
      });
    });

    describe("after the second month", () => {
      const depositAmount = ONE_MAGIC_BN;

      const fixture = deployments.createFixture(async () => {
        const treasureFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

        await magicDepositor.connect(alice).deposit(depositAmount);
        await depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount);
        await depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount);

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        return { ...treasureFixture };
      });

      it("activates the first month and initializes the second month", async () => {
        const { alice, magicDepositor, atlasMine } = await fixture();

        expect(await atlasMine.getAllUserDepositIds(magicDepositor.address)).to.have.length(0);

        // After a deposit has been accumulating user funds for one month,
        // this deposit is forwarded to the AtlasMine. This happens automatically when
        // a user tries to deposit into the contract, initializing a new accumulation deposit
        // for another month
        await magicDepositor.connect(alice).deposit(ONE_MAGIC_BN);
        expect(await atlasMine.getAllUserDepositIds(magicDepositor.address)).to.have.length(1);

        const [firstAtlasDeposit, secondAtlasDeposit] = await Promise.all([
          magicDepositor.atlasDeposits(1),
          magicDepositor.atlasDeposits(2),
        ]);

        checkAtlasDepositHasBeenActivated(firstAtlasDeposit);
        checkAtlasDepositHasBeenInitialized(secondAtlasDeposit);
      });

      it("correctly computes shares", async () => {
        const { alice, prMagicToken, magicDepositor } = await fixture();

        await expect(() =>
          magicDepositor.connect(alice).deposit(depositAmount)
        ).to.changeTokenBalance(prMagicToken, magicDepositor, depositAmount.mul(3));
      });

      it("correctly harvests magic from atlas mine", async () => {
        const { alice, magicToken, magicDepositor } = await fixture();
        await magicDepositor.connect(alice).deposit(depositAmount); // Deposit 1 is activated, Deposit 2 is init'ed

        await timeAndMine.increaseTime(ONE_DAY_IN_SECONDS);

        const [magicBalancePre, internalMagicAccountingPre] = await Promise.all([
          magicToken.balanceOf(magicDepositor.address),
          magicDepositor.heldMagic(),
        ]);

        await magicDepositor.connect(alice).deposit(depositAmount);

        const [magicBalancePost, internalMagicAccountingPost, compoundedMagic] = await Promise.all([
          magicToken.balanceOf(magicDepositor.address),
          magicDepositor.heldMagic(),
          magicDepositor.harvestForNextDeposit(),
        ]);

        expect(magicBalancePost.sub(depositAmount)).to.gte(magicBalancePre);
        // Its (harvestForNextDeposit) zero now because 50% for stakeRewards and 50% for treasury
        // expect(internalMagicAccountingPost).to.be.gte(internalMagicAccountingPre)
        expect(internalMagicAccountingPost).to.gte(internalMagicAccountingPre);

        const expectedCompoundedMagic = magicBalancePost
          .sub(magicBalancePre)
          .sub(depositAmount)
          .div(2); // Divided by two because ~half of the harvested magic goes into the contract
        expect(expectedCompoundedMagic).to.gte(0);
      });
    });

    describe("after the third month", () => {
      const firstMonthDepositAmount = ONE_MAGIC_BN;
      const secondMonthDepositAmount = ONE_THOUSAND_MAGIC_BN.mul(10);

      const fixture = deployments.createFixture(async () => {
        const treasureFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ]);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, firstMonthDepositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, firstMonthDepositAmount, true),
          depositMagicInGuild(carol, magicToken, magicDepositor, firstMonthDepositAmount, true),
        ]);

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, secondMonthDepositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, secondMonthDepositAmount, true),
          depositMagicInGuild(carol, magicToken, magicDepositor, secondMonthDepositAmount, true),
        ]);

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        return { ...treasureFixture };
      });

      it("activates the second month and initializes third month", async () => {
        const { alice, bob, magicToken, magicDepositor } = await fixture();

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, ONE_MAGIC_BN, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, ONE_MAGIC_BN, true),
        ]);

        const [firstAtlasDeposit, secondAtlasDeposit, thirdAtlasDeposit, fourthAtlasDeposit] =
          await Promise.all([
            magicDepositor.atlasDeposits(1),
            magicDepositor.atlasDeposits(2),
            magicDepositor.atlasDeposits(3),
            magicDepositor.atlasDeposits(4),
          ]);

        expect(fourthAtlasDeposit.exists).to.be.equal(false);
        checkAtlasDepositHasBeenActivated(firstAtlasDeposit);
        checkAtlasDepositHasBeenActivated(secondAtlasDeposit);
        checkAtlasDepositHasBeenInitialized(thirdAtlasDeposit);
      });

      it("greatly increases harvest rate after second deposit is activated", async () => {
        const { alice, magicToken, magicDepositor } = await fixture();

        await magicDepositor.update();
        const harvestRatePre = (await magicDepositor.harvestForNextDeposit())
          .mul(PRECISION)
          .div(ONE_MONTH_IN_SECONDS);
        expect(harvestRatePre).to.be.gt(0);

        await depositMagicInGuild(alice, magicToken, magicDepositor, ONE_MAGIC_BN, true);

        expect(await magicDepositor.harvestForNextDeposit()).to.be.equal(0);
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        await magicDepositor.update();
        const harvestRatePost = (await magicDepositor.harvestForNextDeposit())
          .mul(PRECISION)
          .div(ONE_MONTH_IN_SECONDS);

        // expect(harvestRatePost).to.be.gt(harvestRatePre)
      });
    });

    describe("after the 14th month", () => {
      const depositAmount = ONE_THOUSAND_MAGIC_BN;

      /** Simulates the passing of 12 months and deposits */
      const fixture = deployments.createFixture(async () => {
        const treasureFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ]);

        for (let i = 0; i < 13; i++) {
          await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);
          await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
        }

        return { ...treasureFixture };
      });

      it("correctly withdraws the first deposit and reinvests the amount", async () => {
        const { alice, magicToken, magicDepositor, atlasMine } = await fixture();

        // 5 days extra is because AtlasMine defines one year = 365 days, instead of 12 * 30
        const { lockedUntil } = await atlasMine.userInfo(magicDepositor.address, 1);
        await timeAndMine.setTimeNextBlock(lockedUntil.toNumber() + ONE_DAY_IN_SECONDS * 45 + 1);

        // Expect the first deposit to be withdrawn
        const tx = depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);
        await expect(tx)
          .to.emit(atlasMine, "Withdraw")
          .withArgs(magicDepositor.address, 1, depositAmount);

        // Expect the first deposit amount to be relocked
        const { logs } = await awaitTx(tx);
        const log = logs.find(
          ({ topics }) => topics[0] === ethers.utils.id("Deposit(address,uint256,uint256,uint8)")
        );
        if (!log) throw new Error(`Deposit event was not emitted`);
        const {
          args: { amount },
        } = atlasMine.interface.parseLog(log);
        expect(amount as BigNumber).to.be.gte(depositAmount);
      });
    });

    describe("when there are no deposits for more than one month", () => {
      const depositAmount = ONE_THOUSAND_MAGIC_BN;

      const fixture = deployments.createFixture(async () => {
        const treasureFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ]);

        for (let i = 0; i < 2; i++) {
          await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);
          await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
        }

        return { ...treasureFixture };
      });

      it("activates previous month and initializes a new one", async () => {
        const { alice, magicToken, magicDepositor, atlasMine } = await fixture();

        const { lockedUntil } = await atlasMine.userInfo(magicDepositor.address, 1);
        await timeAndMine.setTimeNextBlock(lockedUntil.toNumber() + ONE_DAY_IN_SECONDS * 45);

        await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);

        const [firstAtlasDeposit, secondAtlasDeposit, thirdAtlasDeposit] = await Promise.all([
          magicDepositor.atlasDeposits(1),
          magicDepositor.atlasDeposits(2),
          magicDepositor.atlasDeposits(3),
        ]);

        checkAtlasDepositHasBeenActivated(firstAtlasDeposit);
        checkAtlasDepositHasBeenActivated(secondAtlasDeposit);
        checkAtlasDepositHasBeenInitialized(thirdAtlasDeposit);
      });
    });
  });

  describe("claimMintedShares()", () => {
    const depositAmount = ONE_THOUSAND_MAGIC_BN;

    const fixture = deployments.createFixture(async () => {
      const treasureFixture = await TreasureFixture();
      const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

      for (let i = 0; i < 3; i++) {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
          depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount),
        ]);
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
      }

      await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);
      return { ...treasureFixture };
    });

    it("rejects claims to non-existing deposits", async () => {
      const { mallory, magicDepositor } = await fixture();
      await expect(
        magicDepositor.connect(mallory).claimMintedShares(ethers.constants.MaxUint256, false)
      ).to.be.revertedWith("Deposit does not exist");
    });

    it("rejects claims to inactive deposits", async () => {
      const { mallory, magicDepositor } = await fixture();
      const lastIndex = await magicDepositor.currentAtlasDepositIndex();
      await expect(
        magicDepositor.connect(mallory).claimMintedShares(lastIndex, false)
      ).to.be.revertedWith("Deposit has not been activated");
    });
    it("rejects claiming to deposits where the sender has not participated", async () => {
      const { mallory, magicDepositor } = await fixture();
      await expect(magicDepositor.connect(mallory).claimMintedShares(1, false)).to.be.revertedWith(
        "Nothing to claim"
      );
    });
    it("rejects trying to claim twice", async () => {
      const { alice, magicDepositor } = await fixture();
      await magicDepositor.connect(alice).claimMintedShares(1, false);
      await expect(magicDepositor.connect(alice).claimMintedShares(1, false)).to.be.revertedWith(
        "Nothing to claim"
      );
    });

    it("correctly transfer shares to the claimant", async () => {
      const { alice, bob, magicToken, prMagicToken, magicDepositor } = await TreasureFixture();
      // In first month
      {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await expect(magicDepositor.connect(alice).claimMintedShares(1, false))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, alice.address, depositAmount);
      }

      // In second month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        const [aliceMintedShares, bobMintedShares] = await Promise.all([
          magicDepositor.connect(alice).callStatic.claimMintedShares(depositIndex, false),
          magicDepositor.connect(bob).callStatic.claimMintedShares(depositIndex, false),
        ]);

        expect(aliceMintedShares).to.be.equal(bobMintedShares).and.equal(depositAmount);

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, false))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, alice.address, aliceMintedShares);
      }

      // In third month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        const [aliceMintedShares, bobMintedShares] = await Promise.all([
          magicDepositor.connect(alice).callStatic.claimMintedShares(depositIndex, false),
          magicDepositor.connect(bob).callStatic.claimMintedShares(depositIndex, false),
        ]);

        expect(aliceMintedShares).to.be.equal(bobMintedShares).and.equal(depositAmount);

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, false))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, alice.address, aliceMintedShares);
      }
    });

    it("Staking prMagic token afterClaiming", async () => {
      const { alice, bob, magicToken, prMagicToken, magicDepositor, rewardPool } =
        await TreasureFixture();
      // In first month
      {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await expect(magicDepositor.connect(alice).claimMintedShares(1, true))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, rewardPool.address, depositAmount);

        await expect(magicDepositor.connect(bob).claimMintedShares(1, true))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, rewardPool.address, depositAmount);
      }

      const stakedAlice = await rewardPool.balanceOf(alice.address);
      expect(stakedAlice).to.be.equal(depositAmount);

      const stakedbob = await rewardPool.balanceOf(bob.address);
      expect(stakedbob).to.be.equal(depositAmount);

      // In second month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, true)).to.emit(
          prMagicToken,
          "Transfer"
        );

        await expect(magicDepositor.connect(bob).claimMintedShares(depositIndex, true)).to.emit(
          prMagicToken,
          "Transfer"
        );

        const stakedAlice = await rewardPool.balanceOf(alice.address);
        expect(stakedAlice).to.be.equal(depositAmount.mul(2));

        const stakedbob = await rewardPool.balanceOf(bob.address);
        expect(stakedbob).to.be.equal(depositAmount.mul(2));
      }

      // In third month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        const [aliceMintedShares, bobMintedShares] = await Promise.all([
          magicDepositor.connect(alice).callStatic.claimMintedShares(depositIndex, true),
          magicDepositor.connect(bob).callStatic.claimMintedShares(depositIndex, true),
        ]);

        expect(aliceMintedShares).to.be.equal(bobMintedShares).and.equal(depositAmount);

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, true))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, rewardPool.address, aliceMintedShares);

        await expect(magicDepositor.connect(bob).claimMintedShares(depositIndex, true))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, rewardPool.address, aliceMintedShares);

        const stakedAlice = await rewardPool.balanceOf(alice.address);
        expect(stakedAlice).to.be.equal(depositAmount.mul(3));

        const stakedbob = await rewardPool.balanceOf(bob.address);
        expect(stakedbob).to.be.equal(depositAmount.mul(3));
      }
    });
  });

  describe("Nft Staking", () => {
    describe("Treasure Staking/Unstaking/Withdrawing", () => {
      const checkStakedTreasure = async (
        wallet: Wallet | SignerWithAddress,
        magicDepositor: MagicDepositor,
        treasure: Treasure,
        atlasMine: AtlasMine,
        TREASURE_TOKEN_ID: number,
        treasureBoost: BigNumber,
        stakedTreasureAmount: number,
        totalStaked: number
      ) => {
        await expect(
          stakeTreasures(
            wallet,
            treasure,
            magicDepositor,
            TREASURE_TOKEN_ID,
            stakedTreasureAmount,
            "0x",
            true
          )
        )
          .to.emit(atlasMine, "Staked")
          .withArgs(treasure.address, TREASURE_TOKEN_ID, stakedTreasureAmount, treasureBoost);

        expect(
          await atlasMine.treasureStaked(magicDepositor.address, TREASURE_TOKEN_ID)
        ).to.be.equal(stakedTreasureAmount);

        expect(await atlasMine.treasureStakedAmount(magicDepositor.address)).to.be.equal(
          totalStaked
        );
      };

      const checkUnStakedTreasure = async (
        wallet: Wallet | SignerWithAddress,
        magicDepositor: MagicDepositor,
        treasure: Treasure,
        atlasMine: AtlasMine,
        TREASURE_TOKEN_ID: number,
        treasureBoost: BigNumber,
        unStakedTreasureAmount: number,
        specificTreasureAmount_With_TreasureTokenId: number,
        afterUnstakingTotalStakedTreasure: number
      ) => {
        await expect(
          unStakeTreasures(
            wallet,
            treasure,
            magicDepositor,
            TREASURE_TOKEN_ID,
            unStakedTreasureAmount
          )
        )
          .to.emit(atlasMine, "Unstaked")
          .withArgs(treasure.address, TREASURE_TOKEN_ID, unStakedTreasureAmount, treasureBoost);

        expect(
          await atlasMine.treasureStaked(magicDepositor.address, TREASURE_TOKEN_ID)
        ).to.be.equal(specificTreasureAmount_With_TreasureTokenId);

        expect(await atlasMine.treasureStakedAmount(magicDepositor.address)).to.be.equal(
          afterUnstakingTotalStakedTreasure
        );
      };

      it("Staking Treasure", async () => {
        const { alice, magicDepositor, treasure, atlasMine } = await TreasureFixture();
        const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0];
        const stakedTreasureAmount = ONE_TREAUSRE;
        const totalStaked = stakedTreasureAmount;
        const treasureBoost = await atlasMine.getNftBoost(
          treasure.address,
          TREASURE_TOKEN_ID,
          ONE_TREAUSRE
        );
        await checkStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID,
          treasureBoost,
          stakedTreasureAmount,
          totalStaked
        );
      });

      it("Staking 2 treasure", async () => {
        const { alice, magicDepositor, treasure, atlasMine } = await TreasureFixture();
        const TREASURE_TOKEN_ID_0 = TREASURE_TOKEN_IDS[0];
        const stakedTreasureAmount = ONE_TREAUSRE;
        const totalStaked = stakedTreasureAmount;
        const treasureBoost = await atlasMine.getNftBoost(
          treasure.address,
          TREASURE_TOKEN_ID_0,
          stakedTreasureAmount
        );
        await checkStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID_0,
          treasureBoost,
          stakedTreasureAmount,
          totalStaked
        );
        const contractBoost = await atlasMine.boosts(magicDepositor.address);
        const TREASURE_TOKEN_ID_1 = TREASURE_TOKEN_IDS[1];
        const treasureBoost1 = (
          await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID_1, stakedTreasureAmount)
        ).add(contractBoost);

        const totalStaked1 = stakedTreasureAmount * 2;
        await checkStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID_1,
          treasureBoost1,
          stakedTreasureAmount,
          totalStaked1
        );
      });

      it("UnStaking Treasure", async () => {
        const { alice, treasure, magicDepositor, atlasMine } = await TreasureFixture();
        const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0];
        const stakedTreasureAmount = ONE_TREAUSRE;
        const totalStaked = stakedTreasureAmount;
        const treasureBoost = await atlasMine.getNftBoost(
          treasure.address,
          TREASURE_TOKEN_ID,
          ONE_TREAUSRE
        );
        await checkStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID,
          treasureBoost,
          stakedTreasureAmount,
          totalStaked
        );

        const unStakedTreasureAmount = ONE_TREAUSRE;
        const afterUnstakingTotalAmount = totalStaked - stakedTreasureAmount;
        const specificTreasureAmount_With_TreasureTokenId =
          stakedTreasureAmount - unStakedTreasureAmount;
        const contractBoost = await atlasMine.boosts(magicDepositor.address);
        const treasureBoost1 = contractBoost.sub(
          await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, stakedTreasureAmount)
        );
        await checkUnStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID,
          treasureBoost1,
          unStakedTreasureAmount,
          specificTreasureAmount_With_TreasureTokenId,
          afterUnstakingTotalAmount
        );
      });

      it("UnStaking 2 Treasureres", async () => {
        const { alice, treasure, magicDepositor, atlasMine } = await TreasureFixture();
        const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0];
        const stakedTreasureAmount = ONE_TREAUSRE;
        const totalStaked = stakedTreasureAmount;
        const treasureBoost = await atlasMine.getNftBoost(
          treasure.address,
          TREASURE_TOKEN_ID,
          stakedTreasureAmount
        );
        await checkStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID,
          treasureBoost,
          stakedTreasureAmount,
          totalStaked
        );

        const TREASURE_TOKEN_ID1 = TREASURE_TOKEN_IDS[1];
        const stakedTreasureAmount1 = ONE_TREAUSRE;
        const totalStaked1 = totalStaked + stakedTreasureAmount1;
        const contractBoost = await atlasMine.boosts(magicDepositor.address);
        const treasureBoost1 = contractBoost.add(
          await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID1, stakedTreasureAmount1)
        );
        await checkStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID1,
          treasureBoost1,
          stakedTreasureAmount1,
          totalStaked1
        );

        const unStakedTreasureAmount = ONE_TREAUSRE;
        const specificTreasureAmount_With_TreasureTokenId = totalStaked - unStakedTreasureAmount;
        const afterUnstakingTotalStakedAmount = totalStaked1 - unStakedTreasureAmount;
        const contractBoost1 = await atlasMine.boosts(magicDepositor.address);
        const treasureBoost2 = contractBoost1.sub(
          await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, unStakedTreasureAmount)
        );
        await checkUnStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID,
          treasureBoost2,
          unStakedTreasureAmount,
          specificTreasureAmount_With_TreasureTokenId,
          afterUnstakingTotalStakedAmount
        );

        const unStakedTreasureAmount1 = ONE_TREAUSRE;
        const specificTreasureAmount_With_TreasureTokenId1 = totalStaked - unStakedTreasureAmount1;
        const afterUnstakingTotalStakedAmount1 =
          afterUnstakingTotalStakedAmount - unStakedTreasureAmount1;
        const contractBoost2 = await atlasMine.boosts(magicDepositor.address);
        const treasureBoost3 = contractBoost2.sub(
          await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID1, unStakedTreasureAmount1)
        );
        await checkUnStakedTreasure(
          alice,
          magicDepositor,
          treasure,
          atlasMine,
          TREASURE_TOKEN_ID1,
          treasureBoost3,
          unStakedTreasureAmount1,
          specificTreasureAmount_With_TreasureTokenId1,
          afterUnstakingTotalStakedAmount1
        );
      });

      it("Withdrawing Treasurer", async () => {
        //Let only transfer nft to magic staking contract and then withdraw it
        const { alice, treasure, magicDepositor, atlasMine } = await TreasureFixture();
        const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0];
        const amount = ONE_TREAUSRE;
        await treasure
          .connect(alice)
          .safeTransferFrom(alice.address, magicDepositor.address, TREASURE_TOKEN_ID, amount, "0x");

        //Withdrawing Treasure Back

        await magicDepositor.withdrawERC1155(
          treasure.address,
          alice.address,
          TREASURE_TOKEN_ID,
          amount
        );
      });
    });

    describe("Legions Staking/Unstaking/Withdrawing", () => {
      const checkStakedLegion = async (
        alice: Wallet | SignerWithAddress,
        magicDepositor: MagicDepositor,
        legion: Legion,
        atlasMine: AtlasMine,
        LEGION_TOKEN_ID: number,
        legionBoost: BigNumber,
        afterStakingLegionAmount: number[]
      ) => {
        await expect(stakeLegion(alice, legion, magicDepositor, LEGION_TOKEN_ID, true))
          .to.emit(atlasMine, "Staked")
          .withArgs(legion.address, LEGION_TOKEN_ID, 1, legionBoost);
        const stakedLegions = (await atlasMine.getStakedLegions(magicDepositor.address)).map(
          (value) => value.toNumber()
        );
        expect(stakedLegions).to.deep.equal(afterStakingLegionAmount);
      };

      const checkUnStakedLegion = async (
        alice: Wallet | SignerWithAddress,
        magicDepositor: MagicDepositor,
        legion: Legion,
        atlasMine: AtlasMine,
        LEGION_TOKEN_ID: number,
        legionBoost: BigNumber,
        afterStakingLegionAmount: number[]
      ) => {
        await expect(unStakeLegion(alice, legion, magicDepositor, LEGION_TOKEN_ID))
          .to.emit(atlasMine, "Unstaked")
          .withArgs(legion.address, LEGION_TOKEN_ID, 1, legionBoost);
        const stakedLegions = (await atlasMine.getStakedLegions(magicDepositor.address)).map(
          (value) => value.toNumber()
        );
        expect(stakedLegions).to.deep.equal(afterStakingLegionAmount);
      };

      it("Staking Legions", async () => {
        const { alice, magicDepositor, legion, atlasMine } = await TreasureFixture();
        const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0];
        const legionBoost = await atlasMine.getNftBoost(
          legion.address,
          LEGION_TOKEN_ID_0,
          ONE_LEGION
        );
        const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0];

        await checkStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_0,
          legionBoost,
          afterStakingLegionAmount
        );
      });

      it("Staking 2  Legion", async () => {
        const { alice, magicDepositor, legion, atlasMine } = await TreasureFixture();
        const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0];
        const legionBoost = await atlasMine.getNftBoost(
          legion.address,
          LEGION_TOKEN_ID_0,
          ONE_LEGION
        );
        const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0];

        await checkStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_0,
          legionBoost,
          afterStakingLegionAmount
        );

        const contractBoost = await atlasMine.boosts(magicDepositor.address);
        const LEGION_TOKEN_ID_1 = LEGION_TOKEN_IDS[1];
        const legionBoost1 = (
          await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_1, ONE_LEGION)
        ).add(contractBoost);
        const afterStakingLegionAmount1: number[] = [LEGION_TOKEN_ID_0, LEGION_TOKEN_ID_1];

        await checkStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_1,
          legionBoost1,
          afterStakingLegionAmount1
        );
      });

      it("UnStaking Legion", async () => {
        const { alice, magicDepositor, legion, atlasMine } = await TreasureFixture();
        const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0];
        const legionBoost = await atlasMine.getNftBoost(
          legion.address,
          LEGION_TOKEN_ID_0,
          ONE_LEGION
        );
        const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0];

        await checkStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_0,
          legionBoost,
          afterStakingLegionAmount
        );

        const afterUnstakingTotalAmount: number[] = [];
        const contractBoost = await atlasMine.boosts(magicDepositor.address);
        const legionBoost1 = contractBoost.sub(
          await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, 0) //no use of passing amount here
        );
        await checkUnStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_0,
          legionBoost1,
          afterUnstakingTotalAmount
        );
      });

      it("UnStaking 2  Legion", async () => {
        const { alice, magicDepositor, legion, atlasMine } = await TreasureFixture();
        const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0];
        const legionBoost = await atlasMine.getNftBoost(
          legion.address,
          LEGION_TOKEN_ID_0,
          ONE_LEGION
        );
        const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0];

        await checkStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_0,
          legionBoost,
          afterStakingLegionAmount
        );

        const LEGION_TOKEN_ID_1 = LEGION_TOKEN_IDS[1];
        const contractBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_1, 0); //no use of passing amount here
        const legionBoost1 = (await atlasMine.boosts(magicDepositor.address)).add(contractBoost);
        const afterStakingLegionAmount1: number[] = [LEGION_TOKEN_ID_0, LEGION_TOKEN_ID_1];

        await checkStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_1,
          legionBoost1,
          afterStakingLegionAmount1
        );

        const afterUnstakingTotalAmount: number[] = [LEGION_TOKEN_ID_1];
        const contractBoost1 = await atlasMine.boosts(magicDepositor.address);
        const legionBoost2 = contractBoost1.sub(
          await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, 0) //no use of passing amount here, so put 0
        );
        await checkUnStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_0,
          legionBoost2,
          afterUnstakingTotalAmount
        );

        const afterUnstakingTotalAmount1: number[] = [];
        const contractBoost2 = await atlasMine.boosts(magicDepositor.address);
        const legionBoost3 = contractBoost2.sub(
          await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_1, 0) //no use of passing amount here
        );
        await checkUnStakedLegion(
          alice,
          magicDepositor,
          legion,
          atlasMine,
          LEGION_TOKEN_ID_1,
          legionBoost3,
          afterUnstakingTotalAmount1
        );
      });

      it("Withdrawing Legion", async () => {
        //Let only transfer nft to magic staking contract and then withdraw it
        const { alice, legion, magicDepositor, atlasMine } = await TreasureFixture();
        const LEGION_TOKEN_ID = LEGION_TOKEN_IDS[0];

        await legion
          .connect(alice)
          .transferFrom(alice.address, magicDepositor.address, LEGION_TOKEN_ID);

        //Withdrawing Legion Back

        await magicDepositor.withdrawERC721(legion.address, alice.address, LEGION_TOKEN_ID);
      });
    });
  });
});
