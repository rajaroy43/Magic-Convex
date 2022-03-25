import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { ethers } from 'ethers'

import { ONE_MAGIC_BN, ONE_MONTH_IN_SECONDS, ONE_THOUSAND_MAGIC_BN } from '../../utils/constants'

import { deployments, timeAndMine } from 'hardhat'
import { depositMagicInGuild } from '../../utils/DepositMagicInGuild'
import { stakePrMagic } from '../../utils/StakeRewardPool'
describe('Reward Pool', () => {
  it('Reward Pool Initialized', async () => {
    const {
      prMagicToken: { address: prMagicTokenAddress },
      magicToken: { address: magicTokenAdrress },
      magicDepositor: { address: magicDepositorAddress },
      rewardPool,
    } = await BaseFixture()
    const stakingToken = await rewardPool.stakingToken()
    const rewardToken = await rewardPool.rewardToken()
    const magicDeposits = await rewardPool.magicDeposits()
    const operator = await rewardPool.operator()
    expect(stakingToken.toLowerCase()).to.eql(prMagicTokenAddress.toLowerCase())
    expect(rewardToken.toLowerCase()).to.eql(magicTokenAdrress.toLowerCase())
    expect(magicDeposits.toLowerCase()).to.eql(magicDepositorAddress.toLowerCase())
    expect(operator.toLowerCase()).to.eql(magicDepositorAddress.toLowerCase())
  })

  describe('Reward Pool staking/withdrawing/rewarding', () => {
    const stakedAmount = ONE_MAGIC_BN

    const fixture = deployments.createFixture(async () => {
      const depositAmount = ONE_THOUSAND_MAGIC_BN
      const baseFixture = await BaseFixture()
      const { alice, bob, carol, magicToken, magicDepositor } = baseFixture

      for (let i = 0; i < 3; i++) {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
          depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount),
        ])

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)
        await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true)
        await magicDepositor.connect(alice).claimMintedShares(i + 1, false)
        await magicDepositor.connect(bob).claimMintedShares(i + 1, false)
        await magicDepositor.connect(carol).claimMintedShares(i + 1, false)
      }
      return { ...baseFixture }
    })

    it('rejects zero inputs', async () => {
      const { alice, rewardPool } = await fixture()

      await expect(rewardPool.stakeFor(alice.address, 0)).to.be.revertedWith('RewardPool : Cannot stake 0')
    })

    describe('User Staking', () => {
      it('Staking prMagic token to reward pool by users', async () => {
        const { alice, bob, rewardPool, prMagicToken } = await fixture()

        // First ever user stake
        {
          await expect(rewardPool.connect(alice).stake(stakedAmount))
            .to.emit(rewardPool, 'Staked')
            .withArgs(alice.address, stakedAmount)

          expect(await rewardPool.totalSupply()).to.be.equal(stakedAmount)
          expect(await rewardPool.balanceOf(alice.address)).to.be.equal(stakedAmount)
        }

        // Secondary user stake
        {
          await prMagicToken.connect(bob).approve(rewardPool.address, ethers.constants.MaxUint256)
          await expect(rewardPool.connect(bob).stake(stakedAmount))
            .to.emit(rewardPool, 'Staked')
            .withArgs(bob.address, stakedAmount)

          expect(await rewardPool.totalSupply()).to.be.equal(stakedAmount.mul(2))
          expect(await rewardPool.balanceOf(bob.address)).to.be.equal(stakedAmount)
        }

        // First stake increment
        {
          await expect(rewardPool.connect(alice).stake(stakedAmount))
            .to.emit(rewardPool, 'Staked')
            .withArgs(alice.address, stakedAmount)

          expect(await rewardPool.totalSupply()).to.be.equal(stakedAmount.mul(3))
          expect(await rewardPool.balanceOf(alice.address)).to.be.equal(stakedAmount.mul(2))
        }

      })
    })

    describe('User Withdrawing staked amount', () => {
      const fixtureAfterStaking = deployments.createFixture(async () => {
        const baseFixture = await fixture()
        const { alice, bob, carol, prMagicToken, rewardPool } = baseFixture

        await stakePrMagic(alice, prMagicToken, rewardPool, stakedAmount, true)
        await stakePrMagic(bob, prMagicToken, rewardPool, stakedAmount)
        await stakePrMagic(carol, prMagicToken, rewardPool, stakedAmount)
        return { ...baseFixture }
      })

      it('withdrawing prMagic token from reward pool by users', async () => {
        const { alice, rewardPool } = await fixtureAfterStaking()

        // 3prMagic token staked , so if first withdraw then only 2prMagic will be remaining
        {
          await expect(rewardPool.connect(alice).withdraw(stakedAmount, true))
            .to.emit(rewardPool, 'Withdrawn')
            .withArgs(alice.address, stakedAmount)

          // Can't withdraw now by alice because 0 amount in the pool contract
          await expect(rewardPool.withdraw(stakedAmount, true)).to.be.reverted
        }
      })
    })
  })
})
