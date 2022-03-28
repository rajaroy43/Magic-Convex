import { expect } from "chai";
import { BaseFixture } from "./fixtures/BaseFixture";
import { ethers } from "ethers";

import { ONE_MAGIC_BN, ONE_MONTH_IN_SECONDS, ONE_THOUSAND_MAGIC_BN } from "../utils/constants";

import { deployments, timeAndMine } from "hardhat";
import { depositMagicInGuild } from "../utils/DepositMagicInGuild";
import { stakePrMagic } from "../utils/StakeRewardPool";
import { IERC20, RewardPool } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { awaitTx } from "../utils/AwaitTx";
describe("Reward Pool", () => {
  describe("Reward Pool Intialization", () => {
    it("Reward Pool Initialized", async () => {
      const {
        prMagicToken: { address: prMagicTokenAddress },
        magicToken: { address: magicTokenAdrress },
        magicDepositor: { address: magicDepositorAddress },
        rewardPool,
      } = await BaseFixture();
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
      const { alice, rewardPool } = await BaseFixture();
      const stakedAmount = ONE_THOUSAND_MAGIC_BN;
      await expect(
        rewardPool.connect(alice).stakeFor(alice.address, stakedAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Will get 0 zero reward if no staking yet", async () => {
      const { alice, rewardPool } = await BaseFixture();

      const rewardPoolBalancePre = await rewardPool.balanceOf(alice.address);
      await expect(rewardPool.connect(alice).getReward(alice.address)).to.not.emit(
        rewardPool,
        "RewardPaid"
      );

      const rewardPoolBalancePost = await rewardPool.balanceOf(alice.address);
      expect(rewardPoolBalancePost).to.equal(rewardPoolBalancePre);
    });

    it("Should not withdraw any amount if stakeAmount = 0", async () => {
      const { alice, rewardPool } = await BaseFixture();
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
      const baseFixture = await BaseFixture();
      const { alice, bob, carol, magicToken, magicDepositor } = baseFixture;

      for (let i = 0; i < 3; i++) {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
          depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount),
        ]);

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
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
          await prMagicToken.connect(bob).approve(rewardPool.address, ethers.constants.MaxUint256);
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

    describe("Withdrawing prMAgic from reward pool", () => {
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

      it("withdrawing consecutively prMagic token from reward pool by users without claiming", async () => {
        const { alice, rewardPool, magicToken } = await fixtureAfterStaking();
        const claimReward = false;
        const { magicBalancePost, magicBalancePre } = await checkWithdraw(
          rewardPool,
          alice,
          magicToken,
          claimReward
        );
        expect(magicBalancePost).to.equal(magicBalancePre);
        // Can't withdraw now by alice because now 0 staked amount of alice in the pool contract
        await expect(rewardPool.connect(alice).withdraw(stakedAmount, claimReward)).to.be.reverted;
      });

      it("withdrawing consecutively prMagic token from reward pool by users with claiming", async () => {
        const { alice, rewardPool, magicToken } = await fixtureAfterStaking();
        const claimReward = true;
        const { magicBalancePost, magicBalancePre } = await checkWithdraw(
          rewardPool,
          alice,
          magicToken,
          claimReward
        );
        expect(magicBalancePost).to.gte(magicBalancePre);
        // Can't withdraw now by alice because now 0 staked amount of alice in the pool contract
        await expect(rewardPool.connect(alice).withdraw(stakedAmount, claimReward)).to.be.reverted;
      });

      describe("Geting reward ", () => {
        it("Geting reward  from reward pool by users without donating by anyone", async () => {
          const { alice, rewardPool, magicToken } = await fixtureAfterStaking();
          const magicBalancePre = await magicToken.balanceOf(alice.address);
          const rewardEvents = await (await (await rewardPool.connect(alice).getReward(alice.address)).wait()).events
          // @ts-ignore
          const rewardEarned = rewardEvents[rewardEvents.length-1].args['reward']
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
          const { alice,carol, bob, rewardPool, magicToken ,magicDepositor} = await fixtureAfterStaking();
          const bobMagicBal = await magicToken.balanceOf(bob.address);
          const rewardPoolMagicBalPre = await magicToken.balanceOf(rewardPool.address);
          await magicToken.connect(bob).approve(rewardPool.address, bobMagicBal);
          await rewardPool.connect(bob).donate(bobMagicBal);
          const queuedRewards = await rewardPool.queuedRewards();
          const rewardPoolMagicBalPost = await magicToken.balanceOf(rewardPool.address);
          expect(queuedRewards).to.equal(bobMagicBal);
          expect(rewardPoolMagicBalPost).to.equal(rewardPoolMagicBalPre.add(bobMagicBal));

          // earmarking reward from magicDepositor
          
          await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1);
          await expect(depositMagicInGuild(carol, magicToken, magicDepositor, ONE_MAGIC_BN))
          .to.emit(rewardPool,"RewardAdded")
          const magicBalancePre = await magicToken.balanceOf(alice.address);
          const rewardEvents = await (await (await rewardPool.connect(alice).getReward(alice.address)).wait()).events
          // @ts-ignore
          const rewardEarned = rewardEvents[rewardEvents.length-1].args['reward']
          const magicBalancePost = await magicToken.balanceOf(alice.address);
          expect(magicBalancePost).to.equal(magicBalancePre.add(rewardEarned));
        });
      });
    });
  });
});
