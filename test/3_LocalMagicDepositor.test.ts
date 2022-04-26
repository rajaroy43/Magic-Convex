import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { deployments, ethers, timeAndMine, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { TreasureFixture } from "./fixtures/TreasureFixture";
import { depositMagicInGuild } from "../utils/DepositMagicInGuild";
import {
  ONE_DAY_IN_SECONDS,
  ONE_MAGIC_BN,
  ONE_WEEK_IN_SECONDS,
  PRECISION,
  ONE_THOUSAND_MAGIC_BN,
  ONE_LEGION,
  ONE_TREAUSRE,
  TREASURE_TOKEN_IDS,
  LEGION_TOKEN_IDS,
  ARBITRUM_BLOCK_GAS_LIMIT,
  ONE_MONTH_IN_SECONDS,
} from "../utils/constants";
import { awaitTx } from "../utils/AwaitTx";
import {
  stakeLegion,
  stakeTreasures,
  unStakeLegion,
  unStakeTreasures,
} from "../utils/MagicNftStaking";
import { MagicDepositor, Treasure, Legion, RewardPool, IERC20, MockAtlasMine } from "../typechain";
import { stakePrMagic } from "../utils/StakeRewardPool";

const { AddressZero } = ethers.constants;

describe("Local - MagicDepositor", () => {
  function checkAtlasDepositHasBeenInitialized(atlasDeposit: any, isUpdate?: boolean) {
    expect(atlasDeposit.activationTimestamp).to.be.gt(0);
    isUpdate
      ? expect(atlasDeposit.accumulatedMagic).to.equal(0)
      : expect(atlasDeposit.accumulatedMagic).to.be.gt(0);
    expect(atlasDeposit.isActive).to.be.equal(false);
  }

  function checkAtlasDepositHasBeenActivated(atlasDeposit: any) {
    expect(atlasDeposit.activationTimestamp).to.be.gt(0);
    expect(atlasDeposit.isActive).to.be.equal(true);
  }

  before("tags", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  describe("depositFor()", () => {
    it("rejects zero inputs", async () => {
      const { alice, magicDepositor } = await TreasureFixture();

      await expect(magicDepositor.depositFor(0, alice.address, false)).to.be.revertedWith(
        "amount cannot be 0"
      );
      await expect(magicDepositor.depositFor(1, AddressZero, false)).to.be.revertedWith(
        "cannot deposit for 0x0"
      );
    });

    describe("when the first user deposit happens", () => {
      it("initializes the first deposit with the correct parameters", async () => {
        const { alice, bob, magicToken, magicDepositor } = await TreasureFixture();

        let _activationTimestamp: BigNumber;

        // First ever user deposit
        {
          const currentAtlasDepositIndex = await magicDepositor.currentAtlasDepositIndex();
          await expect(magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address, false))
            .to.emit(magicDepositor, "DepositFor")
            .withArgs(
              alice.address,
              alice.address,
              currentAtlasDepositIndex.add(1),
              ONE_MAGIC_BN,
              false
            );

          expect((await magicDepositor.atlasDeposits(0)).activationTimestamp).to.be.equal(0); // Deposits should start at index 1

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
          const currentAtlasDepositIndex = await magicDepositor.currentAtlasDepositIndex();

          await expect(
            magicDepositor.connect(bob).depositFor(ONE_MAGIC_BN.mul(2), bob.address, false)
          )
            .to.emit(magicDepositor, "DepositFor")
            .withArgs(
              bob.address,
              bob.address,
              currentAtlasDepositIndex,
              ONE_MAGIC_BN.mul(2),
              false
            );

          expect((await magicDepositor.atlasDeposits(2)).activationTimestamp).to.be.equal(0);

          const atlasDeposit = await magicDepositor.atlasDeposits(1);
          const { activationTimestamp, accumulatedMagic, isActive } = atlasDeposit;

          expect(activationTimestamp).to.be.eq(_activationTimestamp);
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN.mul(3));
          expect(isActive).to.be.equal(false);
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(
            ONE_MAGIC_BN.mul(3)
          );
        }

        // First deposit increment
        {
          await magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address, false);

          const atlasDeposit = await magicDepositor.atlasDeposits(1);
          const { activationTimestamp, accumulatedMagic, isActive } = atlasDeposit;

          expect(activationTimestamp).to.be.equal(_activationTimestamp);
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN.mul(4));
          expect(isActive).to.be.equal(false);
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(
            ONE_MAGIC_BN.mul(4)
          );
        }
      });
    });

    describe("after the second week", () => {
      const depositAmount = ONE_MAGIC_BN;

      const fixture = deployments.createFixture(async () => {
        const treasureFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

        await magicDepositor.connect(alice).deposit(depositAmount, false);
        await depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount);
        await depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount);

        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

        return { ...treasureFixture };
      });

      it("activates the first week and initializes the second week", async () => {
        const { alice, magicDepositor, atlasMine } = await fixture();

        expect(await atlasMine.getAllUserDepositIds(magicDepositor.address)).to.have.length(0);

        // After a deposit has been accumulating user funds for one week,
        // this deposit is forwarded to the AtlasMine. This happens automatically when
        // a user tries to deposit into the contract, initializing a new accumulation deposit
        // for another week
        await magicDepositor.connect(alice).deposit(ONE_MAGIC_BN, false);
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

        await expect(() => magicDepositor.connect(alice).update()).to.changeTokenBalance(
          prMagicToken,
          magicDepositor,
          depositAmount.mul(3)
        );
      });

      it("correctly harvests magic from atlas mine", async () => {
        const { alice, magicToken, magicDepositor, rewardPool } = await fixture();
        await magicDepositor.connect(alice).deposit(depositAmount, false); // Deposit 1 is activated, Deposit 2 is init'ed

        await timeAndMine.increaseTime(ONE_DAY_IN_SECONDS);

        const [magicBalancePre, magicBalanceOfRewardPoolPre] = await Promise.all([
          magicToken.balanceOf(magicDepositor.address),
          magicToken.balanceOf(rewardPool.address),
          magicToken.balanceOf(alice.address),
        ]);

        await magicDepositor.connect(alice).deposit(depositAmount, false);

        const [
          magicBalancePost,
          compoundedMagic,
          magicBalanceOfRewardPoolPost,
          aliceMagicBalancePost,
        ] = await Promise.all([
          magicToken.balanceOf(magicDepositor.address),
          magicDepositor.harvestForNextDeposit(),
          magicToken.balanceOf(rewardPool.address),
          magicToken.balanceOf(alice.address),
        ]);

        expect(magicBalanceOfRewardPoolPost).to.gte(magicBalanceOfRewardPoolPre);
        expect(aliceMagicBalancePost.add(depositAmount)).to.gte(magicBalanceOfRewardPoolPre);

        // Because sometime harvestAmount will be as = 777073004001825
        // then stakeRewardIncrement treasuryIncrement   stakeRewardSplit treasurySplit
        //       388536502000912      388536502000912  500000000000000000 500000000000000000
        // so stakeRewardIncrement is 388536502000912 instead of 388536502000912.5
        //same with treasuryIncrement , then after we will subtract it we will get 1 as heldMagicIncrement
        expect(magicBalancePost).to.gte(magicBalancePre.add(depositAmount));

        const expectedCompoundedMagic = magicBalancePost.sub(magicBalancePre).sub(depositAmount);
        expect(expectedCompoundedMagic).to.gte(compoundedMagic);
      });
    });

    describe("after the third week", () => {
      const firstWeekDepositAmount = ONE_MAGIC_BN;
      const secondWeekDepositAmount = ONE_THOUSAND_MAGIC_BN.mul(10);

      const fixture = deployments.createFixture(async () => {
        const treasureFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = treasureFixture;

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ]);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, firstWeekDepositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, firstWeekDepositAmount, true),
          depositMagicInGuild(carol, magicToken, magicDepositor, firstWeekDepositAmount, true),
        ]);

        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, secondWeekDepositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, secondWeekDepositAmount, true),
          depositMagicInGuild(carol, magicToken, magicDepositor, secondWeekDepositAmount, true),
        ]);

        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

        return { ...treasureFixture };
      });

      it("activates the second week and initializes third week", async () => {
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

        expect(fourthAtlasDeposit.activationTimestamp).to.be.equal(0);
        checkAtlasDepositHasBeenActivated(firstAtlasDeposit);
        checkAtlasDepositHasBeenActivated(secondAtlasDeposit);
        checkAtlasDepositHasBeenInitialized(thirdAtlasDeposit);
      });

      it("greatly increases harvest rate after second deposit is activated", async () => {
        const { alice, magicToken, magicDepositor } = await fixture();
        await magicDepositor.update({ gasLimit: ARBITRUM_BLOCK_GAS_LIMIT });

        const harvestRatePre = (await magicDepositor.harvestForNextDeposit())
          .mul(PRECISION)
          .div(ONE_WEEK_IN_SECONDS);

        expect(harvestRatePre).to.be.gte(0);
        await depositMagicInGuild(alice, magicToken, magicDepositor, ONE_MAGIC_BN, true);

        //After activation harvestForNextDeposit will be 0
        expect(await magicDepositor.harvestForNextDeposit()).to.be.equal(0);
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

        await magicDepositor.update({ gasLimit: ARBITRUM_BLOCK_GAS_LIMIT });

        const harvestRatePost = (await magicDepositor.harvestForNextDeposit())
          .mul(PRECISION)
          .div(ONE_WEEK_IN_SECONDS);

        expect(harvestRatePost).to.be.gte(0);
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
        // Expect the first deposit to be withdrawn
        const tx = await magicDepositor.update();
        await expect(tx)
          .to.emit(atlasMine, "Withdraw")
          .withArgs(magicDepositor.address, 1, depositAmount);

        expect(tx).to.emit(magicDepositor, "ActivateDeposit");

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

    describe("when there are no deposits for more than one week", () => {
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
          await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
        }

        return { ...treasureFixture };
      });

      it("activates previous weejk and initializes a new one", async () => {
        const { alice, magicToken, magicDepositor, atlasMine } = await fixture();

        const { lockedUntil } = await atlasMine.userInfo(magicDepositor.address, 1);
        await timeAndMine.setTimeNextBlock(lockedUntil.toNumber() + ONE_DAY_IN_SECONDS * 45);

        await magicDepositor.update();

        const [firstAtlasDeposit, secondAtlasDeposit, thirdAtlasDeposit] = await Promise.all([
          magicDepositor.atlasDeposits(1),
          magicDepositor.atlasDeposits(2),
          magicDepositor.atlasDeposits(3),
        ]);

        checkAtlasDepositHasBeenActivated(firstAtlasDeposit);
        checkAtlasDepositHasBeenActivated(secondAtlasDeposit);
        checkAtlasDepositHasBeenInitialized(thirdAtlasDeposit, true);
      });
    });
  });

  describe("NFT staking", () => {
    const depositAmount = ONE_THOUSAND_MAGIC_BN;

    const fixture = deployments.createFixture(async () => {
      const treasureFixture = await TreasureFixture();
      const { alice, bob, carol, magicToken, magicDepositor, lendingAuctionNft } = treasureFixture;

      await (await lendingAuctionNft.setMagicDepositor(alice.address)).wait();

      for (let i = 0; i < 3; i++) {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
          depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount),
        ]);
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
      }

      await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);
      return { ...treasureFixture };
    });

    it("Staking Treasure", async () => {
      const { alice, magicDepositor, treasure, atlasMine } = await fixture();
      const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0];
      const treasureBoost = await atlasMine.getNftBoost(
        treasure.address,
        TREASURE_TOKEN_ID,
        ONE_TREAUSRE
      );
      const prePendingRewards = await atlasMine.pendingRewardsAll(magicDepositor.address);

      await treasure
        .connect(alice)
        .safeTransferFrom(
          alice.address,
          magicDepositor.address,
          TREASURE_TOKEN_ID,
          ONE_TREAUSRE,
          []
        );
      await magicDepositor.stakeTreasure(TREASURE_TOKEN_ID, ONE_TREAUSRE);

      // increase the boots
      const magicDepositorBoost = await atlasMine.getUserBoost(magicDepositor.address);
      expect(magicDepositorBoost).to.equal(treasureBoost);
      // increase pendingReward
      const postPendingRewards = await atlasMine.pendingRewardsAll(magicDepositor.address);
      expect(postPendingRewards).to.gt(prePendingRewards);
    });

    it("Staking Legion", async () => {
      const { alice, magicDepositor, legion, atlasMine } = await fixture();
      const LEGION_TOKEN_ID = LEGION_TOKEN_IDS[0];
      const legionBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID, ONE_LEGION);
      const prePendingRewards = await atlasMine.pendingRewardsAll(magicDepositor.address);

      await legion
        .connect(alice)
        ["safeTransferFrom(address,address,uint256)"](
          alice.address,
          magicDepositor.address,
          LEGION_TOKEN_ID
        );
      await magicDepositor.stakeLegion(LEGION_TOKEN_ID);

      // increase the boots
      const magicDepositorBoost = await atlasMine.getUserBoost(magicDepositor.address);
      expect(magicDepositorBoost).to.equal(legionBoost);
      // increase pendingReward
      const postPendingRewards = await atlasMine.pendingRewardsAll(magicDepositor.address);
      expect(postPendingRewards).to.gt(prePendingRewards);
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
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
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
      // In first week
      {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await expect(magicDepositor.connect(alice).claimMintedShares(1, false))
          .to.emit(prMagicToken, "Transfer")
          .withArgs(magicDepositor.address, alice.address, depositAmount);
      }

      // In second week
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

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

      // In third week
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

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
      // In first week
      {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ]);

        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
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

      // In second week
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

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

      // In third week
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex();
        await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);

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
        atlasMine: MockAtlasMine,
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
        atlasMine: MockAtlasMine,
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
        atlasMine: MockAtlasMine,
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
        atlasMine: MockAtlasMine,
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

        //Withdrawing Legion Back to user address

        await magicDepositor.withdrawERC721(legion.address, alice.address, LEGION_TOKEN_ID);
      });
    });
  });
  describe("Reward Pool", () => {
    describe("Reward Pool Intialization", () => {
      it("Reward Pool Initialized", async () => {
        const {
          prMagicToken: { address: prMagicTokenAddress },
          magicToken: { address: magicTokenAdrress },
          magicDepositor: { address: magicDepositorAddress },
          rewardPool,
        } = await TreasureFixture();
        const stakingToken = await rewardPool.stakingToken();
        const rewardToken = await rewardPool.rewardToken();
        const operator = await rewardPool.operator();
        expect(stakingToken.toLowerCase()).to.eql(prMagicTokenAddress.toLowerCase());
        expect(rewardToken.toLowerCase()).to.eql(magicTokenAdrress.toLowerCase());
        expect(operator.toLowerCase()).to.eql(magicDepositorAddress.toLowerCase());
        expect(await rewardPool.lastUpdateTime()).to.equal(0);
        expect(await rewardPool.rewardRate()).to.equal(0);
        expect(await rewardPool.historicalRewards()).to.equal(0);
        expect(await rewardPool.periodFinish()).to.equal(0);
        expect(await rewardPool.queuedRewards()).to.equal(0);
        expect(await rewardPool.currentRewards()).to.equal(0);
      });

      it("Staking reward with not enough prMagicToken", async () => {
        const { alice, rewardPool } = await TreasureFixture();
        const stakedAmount = ONE_THOUSAND_MAGIC_BN;
        await expect(
          rewardPool.connect(alice).stakeFor(alice.address, stakedAmount)
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it("Will get 0 zero reward if no staking yet", async () => {
        const { alice, rewardPool } = await TreasureFixture();

        const rewardPoolBalancePre = await rewardPool.balanceOf(alice.address);
        await expect(rewardPool.connect(alice).getReward(alice.address)).to.not.emit(
          rewardPool,
          "RewardPaid"
        );

        const rewardPoolBalancePost = await rewardPool.balanceOf(alice.address);
        expect(rewardPoolBalancePost).to.equal(rewardPoolBalancePre);
      });

      it("Should not withdraw any amount if stakeAmount = 0", async () => {
        const { alice, rewardPool } = await TreasureFixture();
        const withdrawAmount = ONE_THOUSAND_MAGIC_BN;
        await expect(rewardPool.connect(alice).withdraw(withdrawAmount, true)).to.be.revertedWith(
          "Arithmetic operation underflowed"
        );
      });
    });

    describe("Reward Pool staking/withdrawing/rewarding", () => {
      const stakedAmount = ONE_THOUSAND_MAGIC_BN;

      const fixture = deployments.createFixture(async () => {
        const depositAmount = ONE_THOUSAND_MAGIC_BN;
        const baseFixture = await TreasureFixture();
        const { alice, bob, carol, magicToken, magicDepositor } = baseFixture;

        for (let i = 0; i < 3; i++) {
          await Promise.all([
            depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
            depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
            depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount),
          ]);

          await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
          await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true);

          await magicDepositor.connect(alice).claimMintedShares(i + 1, false);
          await magicDepositor.connect(bob).claimMintedShares(i + 1, false);
          await magicDepositor.connect(carol).claimMintedShares(i + 1, false);
        }

        return { ...baseFixture };
      });

      it("rejects zero inputs", async () => {
        const { alice, rewardPool } = await fixture();

        await expect(rewardPool.stakeFor(alice.address, 0)).to.be.revertedWith(
          "RewardPool : Cannot stake 0"
        );
      });

      it("Should have zero rewardRate,currentReward and historicalRewards 0 before update", async () => {
        const { rewardPool } = await fixture();
        expect(await rewardPool.currentRewards()).to.equal(0);
        expect(await rewardPool.rewardRate()).to.equal(0);
        expect(await rewardPool.historicalRewards()).to.equal(0);
      });

      describe("Staking prMagic in reward pool", () => {
        it("Staking prMagic token to reward pool by users", async () => {
          const { alice, bob, rewardPool, prMagicToken } = await fixture();

          // First ever user stake
          {
            await expect(rewardPool.connect(alice).stake(stakedAmount))
              .to.emit(rewardPool, "Staked")
              .withArgs(alice.address, stakedAmount);

            expect(await rewardPool.totalSupply()).to.be.equal(stakedAmount);
            expect(await rewardPool.balanceOf(alice.address)).to.be.equal(stakedAmount);
          }

          // Secondary user stake
          {
            await prMagicToken
              .connect(bob)
              .approve(rewardPool.address, ethers.constants.MaxUint256);
            await expect(rewardPool.connect(bob).stake(stakedAmount))
              .to.emit(rewardPool, "Staked")
              .withArgs(bob.address, stakedAmount);

            expect(await rewardPool.totalSupply()).to.be.equal(stakedAmount.mul(2));
            expect(await rewardPool.balanceOf(bob.address)).to.be.equal(stakedAmount);
          }

          // First stake increment
          {
            await expect(rewardPool.connect(alice).stake(stakedAmount))
              .to.emit(rewardPool, "Staked")
              .withArgs(alice.address, stakedAmount);

            expect(await rewardPool.totalSupply()).to.be.equal(stakedAmount.mul(3));
            expect(await rewardPool.balanceOf(alice.address)).to.be.equal(stakedAmount.mul(2));
          }
        });
      });

      describe("Withdrawing prMAgic from reward pool ", () => {
        const withdrawnAmount = stakedAmount.div(10); //100 withdrawn amont
        const fixtureAfterStaking = deployments.createFixture(async () => {
          const baseFixture = await fixture();
          const { alice, bob, carol, prMagicToken, rewardPool } = baseFixture;

          await stakePrMagic(alice, prMagicToken, rewardPool, stakedAmount, true);
          await stakePrMagic(bob, prMagicToken, rewardPool, stakedAmount);
          await stakePrMagic(carol, prMagicToken, rewardPool, stakedAmount);
          return { ...baseFixture };
        });

        const checkWithdraw = async (
          rewardPool: RewardPool,
          alice: SignerWithAddress,
          magicToken: IERC20,
          claimReward: boolean
        ) => {
          const rewardPoolBalancePre = await rewardPool.balanceOf(alice.address);
          const magicBalancePre = await magicToken.balanceOf(alice.address);
          for (let i = 0; i < 10; i++) {
            await expect(rewardPool.connect(alice).withdraw(withdrawnAmount, claimReward))
              .to.emit(rewardPool, "Withdrawn")
              .withArgs(alice.address, withdrawnAmount);
          }
          const rewardPoolBalancePost = await rewardPool.balanceOf(alice.address);
          const magicBalancePost = await magicToken.balanceOf(alice.address);
          expect(rewardPoolBalancePost)
            .to.equal(rewardPoolBalancePre.sub(withdrawnAmount.mul(10)))
            .to.equal(0);
          return { magicBalancePost, magicBalancePre };
        };

        describe("Before earmark rewards", () => {
          it("withdrawing consecutively prMagic token from reward pool by users without claiming", async () => {
            const { alice, rewardPool, magicToken, prMagicToken } = await fixtureAfterStaking();
            const prTokenBalancePre = await prMagicToken.balanceOf(alice.address);
            const claimReward = false;
            const { magicBalancePost, magicBalancePre } = await checkWithdraw(
              rewardPool,
              alice,
              magicToken,
              claimReward
            );
            const prTokenBalancePost = await prMagicToken.balanceOf(alice.address);
            expect(magicBalancePost).to.equal(magicBalancePre);
            expect(prTokenBalancePost).to.equal(prTokenBalancePre.add(stakedAmount));
            // Can't withdraw now by alice because now 0 staked amount of alice in the pool contract
            await expect(rewardPool.connect(alice).withdraw(stakedAmount, claimReward)).to.be
              .reverted;
          });

          it("withdrawing consecutively prMagic token from reward pool by users with claiming", async () => {
            const { alice, rewardPool, magicToken, prMagicToken } = await fixtureAfterStaking();
            const prTokenBalancePre = await prMagicToken.balanceOf(alice.address);
            const claimReward = true;
            const { magicBalancePost, magicBalancePre } = await checkWithdraw(
              rewardPool,
              alice,
              magicToken,
              claimReward
            );
            const prTokenBalancePost = await prMagicToken.balanceOf(alice.address);
            //no reward in RewardPool yet ,that's why we have same magicBalance
            expect(magicBalancePost).to.equal(magicBalancePre);
            expect(prTokenBalancePost).to.equal(prTokenBalancePre.add(stakedAmount));
            // Can't withdraw now by alice because now 0 staked amount of alice in the pool contract
            await expect(rewardPool.connect(alice).withdraw(stakedAmount, claimReward)).to.be
              .reverted;
          });
        });

        describe("After earmark rewards", () => {
          const fixtureAfterRewardEarmarked = deployments.createFixture(async () => {
            const fixtureEarmarked = await fixtureAfterStaking();
            const { magicDepositor } = fixtureEarmarked;
            await magicDepositor.update();
            return { ...fixtureEarmarked };
          });
          it("withdrawing consecutively prMagic token from reward pool by users without claiming", async () => {
            const { alice, rewardPool, magicToken, prMagicToken } =
              await fixtureAfterRewardEarmarked();
            const prTokenBalancePre = await prMagicToken.balanceOf(alice.address);
            const claimReward = false;
            const { magicBalancePost, magicBalancePre } = await checkWithdraw(
              rewardPool,
              alice,
              magicToken,
              claimReward
            );
            const prTokenBalancePost = await prMagicToken.balanceOf(alice.address);
            expect(magicBalancePost).to.equal(magicBalancePre);
            expect(prTokenBalancePost).to.equal(prTokenBalancePre.add(stakedAmount));
            // Can't withdraw now by alice because now 0 staked amount of alice in the pool contract
            await expect(rewardPool.connect(alice).withdraw(stakedAmount, claimReward)).to.be
              .reverted;
          });

          it("withdrawing consecutively prMagic token from reward pool by users with claiming", async () => {
            const { alice, rewardPool, magicToken, prMagicToken } =
              await fixtureAfterRewardEarmarked();
            const prTokenBalancePre = await prMagicToken.balanceOf(alice.address);
            const claimReward = true;
            const { magicBalancePost, magicBalancePre } = await checkWithdraw(
              rewardPool,
              alice,
              magicToken,
              claimReward
            );
            const prTokenBalancePost = await prMagicToken.balanceOf(alice.address);
            expect(magicBalancePost).to.gt(magicBalancePre);
            expect(prTokenBalancePost).to.equal(prTokenBalancePre.add(stakedAmount));
            // Can't withdraw now by alice because now 0 staked amount of alice in the pool contract
            await expect(rewardPool.connect(alice).withdraw(stakedAmount, claimReward)).to.be
              .reverted;
          });
          describe("Geting reward ", () => {
            it("Geting reward  from reward pool by users without donating by anyone", async () => {
              const { alice, rewardPool, magicToken } = await fixtureAfterRewardEarmarked();
              const magicBalancePre = await magicToken.balanceOf(alice.address);
              const rewardEvents = (
                await (await rewardPool.connect(alice).getReward(alice.address)).wait()
              ).events;
              // @ts-ignore
              const rewardEarned = rewardEvents[rewardEvents.length - 1].args["reward"];
              const magicBalancePost = await magicToken.balanceOf(alice.address);
              expect(magicBalancePost).to.equal(magicBalancePre.add(rewardEarned));
              // get reward as 0.0000000000000something  amount
              await expect(await rewardPool.connect(alice).getReward(alice.address)).to.emit(
                rewardPool,
                "RewardPaid"
              );
              const magicBalancePostAfterReward = await magicToken.balanceOf(alice.address);
              expect(magicBalancePostAfterReward).to.gte(magicBalancePost);
            });

            it("Geting reward  from reward pool  by users with donating ", async () => {
              const { alice, carol, bob, rewardPool, magicToken, magicDepositor } =
                await fixtureAfterStaking();
              const bobMagicBal = await magicToken.balanceOf(bob.address);
              const rewardPoolMagicBalPre = await magicToken.balanceOf(rewardPool.address);
              await magicToken.connect(bob).approve(rewardPool.address, bobMagicBal);
              await rewardPool.connect(bob).donate(bobMagicBal);
              const queuedRewards = await rewardPool.queuedRewards();
              const rewardPoolMagicBalPost = await magicToken.balanceOf(rewardPool.address);
              expect(queuedRewards).to.equal(bobMagicBal);
              expect(rewardPoolMagicBalPost).to.equal(rewardPoolMagicBalPre.add(bobMagicBal));

              // earmarking reward from magicDepositor

              await timeAndMine.increaseTime(ONE_WEEK_IN_SECONDS + 1);
              await expect(magicDepositor.update()).to.emit(rewardPool, "RewardAdded");
              const magicBalancePre = await magicToken.balanceOf(alice.address);
              const rewardEvents = (
                await (await rewardPool.connect(alice).getReward(alice.address)).wait()
              ).events;
              // @ts-ignore
              const rewardEarned = rewardEvents[rewardEvents.length - 1].args["reward"];
              const magicBalancePost = await magicToken.balanceOf(alice.address);
              expect(magicBalancePost).to.equal(magicBalancePre.add(rewardEarned));
            });
          });
        });
      });
    });
  });
});
