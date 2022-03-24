import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { BigNumber, ethers, Wallet } from 'ethers'

import { ONE_MAGIC_BN, ONE_MONTH_IN_SECONDS, ONE_THOUSAND_MAGIC_BN } from '../utils/constants'
import { stakeLegion, stakeTreasures, unStakeLegion, unStakeTreasures } from '../utils/MagicNftStaking'
import { AtlasMine, IERC1155, IERC721, MagicStaking } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deployments, timeAndMine } from 'hardhat'
import { depositMagicInGuild } from '../utils/DepositMagicInGuild'
import { stakeMgMagic } from '../utils/StakeRewardPool'
const { AddressZero } = ethers.constants
describe('Reward Pool', () => {
  it('Reward Pool Initialized', async () => {
    const {
      mgMagicToken: { address: mgMagicTokenAddress },
      magicToken: { address: magicTokenAdrress },
      magicDepositor: { address: magicDepositorAddress },
      rewardPool,
    } = await BaseFixture()
    const stakingToken = await rewardPool.stakingToken()
    const rewardToken = await rewardPool.rewardToken()
    const magicDeposits = await rewardPool.magicDeposits()
    const operator = await rewardPool.operator()
    expect(stakingToken.toLowerCase()).to.eql(mgMagicTokenAddress.toLowerCase())
    expect(rewardToken.toLowerCase()).to.eql(magicTokenAdrress.toLowerCase())
    expect(magicDeposits.toLowerCase()).to.eql(magicDepositorAddress.toLowerCase())
    expect(operator.toLowerCase()).to.eql(magicDepositorAddress.toLowerCase())
  })

  describe('Reward Pool staking/withdrawing/rewarding', () => {
    const stakedAmount = ONE_MAGIC_BN

    const fixture = deployments.createFixture(async () => {
      const depositAmount = ONE_THOUSAND_MAGIC_BN
      const baseFixture = await BaseFixture()
      const { alice, bob, carol, magicToken, magicDepositor, mgMagicToken, rewardPool } = baseFixture

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
      it('Staking mgMagic token to reward pool by users', async () => {
        const { alice, bob, magicToken, rewardPool, mgMagicToken } = await fixture()

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
          await mgMagicToken.connect(bob).approve(rewardPool.address, ethers.constants.MaxUint256)
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

        //last update will be 0 becuase periodFinish is stil 0

        expect(await rewardPool.lastUpdateTime()).to.be.equal(0)
      })
    })

    describe('User Withdrawing staked amount', () => {
      const fixtureAfterStaking = deployments.createFixture(async () => {
        const baseFixture = await fixture()
        const { alice, bob, carol, mgMagicToken, rewardPool, magicToken, magicDepositor } = baseFixture

        await stakeMgMagic(alice, mgMagicToken, rewardPool, stakedAmount, true)
        await stakeMgMagic(bob, mgMagicToken, rewardPool, stakedAmount)
        await stakeMgMagic(carol, mgMagicToken, rewardPool, stakedAmount)
        return { ...baseFixture }
      })

      it('withdrawing mgMagic token from reward pool by users', async () => {
        const { alice, rewardPool } = await fixtureAfterStaking()

        // 3mgMagic token staked , so if first withdraw then only 2mgMagic will be remaining
        {
          await expect(rewardPool.connect(alice).withdraw(stakedAmount, true))
            .to.emit(rewardPool, 'Withdrawn')
            .withArgs(alice.address, stakedAmount)

          // Can't withdraw now by alice because 0 amount in the pool contract
          await expect(rewardPool.withdraw(stakedAmount, true)).to.be.reverted
        }

        //last update will be 0 because periodFinish is stil 0

        expect(await rewardPool.lastUpdateTime()).to.be.equal(0)
      })

      describe('Earmark rewards and donating mgMagic to rewardPool ', () => {
        it('Earmark Rewards', async () => {
          const { alice, magicDepositor, rewardPool } = await fixtureAfterStaking()

          const stakedHarvested = await magicDepositor.harvestForStakingRewards()
          console.log('Harvest for staking rewards', stakedHarvested.div(ONE_MAGIC_BN).toString(),"magic tokens")

		  await expect(magicDepositor.connect(alice).earmarkRewards()).
		  		to.emit(magicDepositor, 'RewardsEarmarked')

          const beforecurrentAtlasDepositId = await magicDepositor.currentAtlasDepositIndex()

          const beforeatlasDepositAmount = await magicDepositor.getUserDeposittedMagic(
            beforecurrentAtlasDepositId,
            alice.address
		  )
		  const threeDay = 3*24*60*60 
		  await timeAndMine.increaseTime(threeDay)
		  
		  console.log("beforecurrentAtlasDepositId and beforeatlasDepositAmount",beforecurrentAtlasDepositId.toString(),beforeatlasDepositAmount.div(ONE_MAGIC_BN).toString())
  
		const events = (await (await rewardPool.connect(alice).getReward(alice.address)).wait()).events

			// @ts-ignore
		const reward = events[events.length-1].args['reward']

          const afterCurrentAtlasDepositId = await magicDepositor.currentAtlasDepositIndex()
          const afterAtlasDepositAmount = await magicDepositor.getUserDeposittedMagic(
            afterCurrentAtlasDepositId,
            alice.address
		  )

		  console.log("afterCurrentAtlasDepositId and afterAtlasDepositAmount",afterCurrentAtlasDepositId.toString(),afterAtlasDepositAmount.div(ONE_MAGIC_BN).toString())

          expect(reward).to.equal(afterAtlasDepositAmount.sub(beforeatlasDepositAmount))

          // Checking other state variable

          const historicalRewards = await rewardPool.historicalRewards()
          const rewardRate = await rewardPool.rewardRate()
          const currentRewards = await rewardPool.currentRewards()
          const queuedRewards = await rewardPool.queuedRewards()
          const duration = await rewardPool.duration()

          const rewardRatePerSecond = stakedHarvested.div(duration)

          expect(historicalRewards).to.equal(stakedHarvested).to.equal(currentRewards)
          expect(rewardRate).to.equal(rewardRatePerSecond)
          expect(queuedRewards).to.equal(0)
        })

        it('Earmark rewards After Donating mgMagic token', async () => {
          const { alice, bob, magicToken, mgMagicToken, magicDepositor, rewardPool } = await fixtureAfterStaking()
          const magicBal = await magicToken.balanceOf(alice.address)
		  const contractMagicBal = await magicToken.balanceOf(rewardPool.address)
		  
		  await rewardPool.connect(alice).donate(magicBal)
		  
		  
		  const queuedRewardsAFterDonating = await rewardPool.queuedRewards()
		  
		  expect(queuedRewardsAFterDonating).to.be.equal(magicBal)

          const afterDonatongContractMagicBal = await magicToken.balanceOf(rewardPool.address)

          expect(afterDonatongContractMagicBal).to.equal(contractMagicBal.add(magicBal))

          const stakedHarvested = await magicDepositor.harvestForStakingRewards()

          await expect(magicDepositor.connect(alice).earmarkRewards()).to.emit(magicDepositor, 'RewardsEarmarked')

		  const threeDay = 3*24*60*60 
		  await timeAndMine.increaseTime(threeDay)

          const beforeCurrentAtlasDepositId = await magicDepositor.currentAtlasDepositIndex()
          const beforeAtlasDepositAmount = await magicDepositor.getUserDeposittedMagic(
            beforeCurrentAtlasDepositId,
            alice.address
          )
		  console.log("beforecurrentAtlasDepositId and beforeatlasDepositAmount",beforeCurrentAtlasDepositId.toString(),beforeAtlasDepositAmount.div(ONE_MAGIC_BN).toString())
  
          const events = (await (await rewardPool.connect(alice).getReward(alice.address)).wait()).events

          const afterCurrentAtlasDepositId = await magicDepositor.currentAtlasDepositIndex()
          const afterAtlasDepositAmount = await magicDepositor.getUserDeposittedMagic(
            afterCurrentAtlasDepositId,
            alice.address
		  )

		  console.log("afterCurrentAtlasDepositId and afterAtlasDepositAmount",afterCurrentAtlasDepositId.toString(),afterAtlasDepositAmount.div(ONE_MAGIC_BN).toString())

		// @ts-ignore
		const reward = events[events.length-1].args['reward'];

          expect(reward).to.equal(afterAtlasDepositAmount.sub(beforeAtlasDepositAmount))

          // Checking other state variable

          const historicalRewards = await rewardPool.historicalRewards()
          const rewardRate = await rewardPool.rewardRate()
          const currentRewards = await rewardPool.currentRewards()
          const queuedRewards = await rewardPool.queuedRewards()
          const duration = await rewardPool.duration()

          const rewardRatePerSecond = stakedHarvested.add(magicBal).div(duration)

          expect(historicalRewards).to.equal(stakedHarvested.add(magicBal)).to.equal(currentRewards)
          expect(rewardRate).to.equal(rewardRatePerSecond)
          expect(queuedRewards).to.equal(0)
        })
      })
    })
  })
})
