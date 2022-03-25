import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { deployments, ethers, timeAndMine, tracer } from 'hardhat'
import { keccak256, parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import {
  ATLAS_MASTER_OF_COIN_ADDRESS,
  ATLAS_MINE_ADDRESS,
  MAGIC_TOKEN_ADDRESS,
  ONE_DAY_IN_SECONDS,
  ONE_MAGIC_BN,
  ONE_MONTH_IN_SECONDS,
  PRECISION,
  ONE_THOUSAND_MAGIC_BN,
} from '../../utils/constants'
import { AtlasMine__factory } from '../../typechain'
import { depositMagicInGuild } from '../../utils/DepositMagicInGuild'
import { awaitTx } from '../../utils/AwaitTx'

const { AddressZero } = ethers.constants

describe('MagicDepositor', () => {
  function checkAtlasDepositHasBeenInitialized(atlasDeposit: any) {
    expect(atlasDeposit.activationTimestamp).to.be.gt(0)
    expect(atlasDeposit.accumulatedMagic).to.be.gt(0)
    expect(atlasDeposit.mintedShares).to.be.equal(0)
    expect(atlasDeposit.exists).to.be.equal(true)
    expect(atlasDeposit.isActive).to.be.equal(false)
  }

  function checkAtlasDepositHasBeenActivated(atlasDeposit: any) {
    expect(atlasDeposit.exists).to.be.equal(true)
    expect(atlasDeposit.isActive).to.be.equal(true)
    expect(atlasDeposit.mintedShares).to.be.gt(0)
  }

  before('tags', async () => {
    tracer.nameTags[ATLAS_MINE_ADDRESS] = 'AtlasMine'
    tracer.nameTags[MAGIC_TOKEN_ADDRESS] = 'MagicToken'
    tracer.nameTags[ATLAS_MASTER_OF_COIN_ADDRESS] = 'Master of Coin'
  })

  describe('depositFor()', () => {
    it('rejects zero inputs', async () => {
      const { alice, magicDepositor } = await BaseFixture()

      await expect(magicDepositor.depositFor(0, alice.address)).to.be.revertedWith('amount cannot be 0')
      await expect(magicDepositor.depositFor(1, AddressZero)).to.be.revertedWith('cannot deposit for 0x0')
    })

    describe('when the first user deposit happens', () => {
      it('initializes the first deposit with the correct parameters', async () => {
        const { alice, bob, magicToken, magicDepositor } = await BaseFixture()

        let _activationTimestamp: BigNumber

        // First ever user deposit
        {
          await magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address)

          expect((await magicDepositor.atlasDeposits(0)).exists).to.be.equal(false) // Deposits should start at index 1

          const atlasDeposit = await magicDepositor.atlasDeposits(1)
          const { activationTimestamp, accumulatedMagic } = atlasDeposit
          _activationTimestamp = activationTimestamp // Save for later checks

          checkAtlasDepositHasBeenInitialized(atlasDeposit)
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN)
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC_BN)
          expect(await magicDepositor.getUserDeposittedMagic(1, alice.address)).to.be.equal(ONE_MAGIC_BN)
        }

        // Secondary user deposit
        {
          await magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256)
          await magicDepositor.connect(bob).depositFor(ONE_MAGIC_BN.mul(2), bob.address)

          expect((await magicDepositor.atlasDeposits(2)).exists).to.be.equal(false)

          const atlasDeposit = await magicDepositor.atlasDeposits(1)
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } = atlasDeposit

          expect(activationTimestamp).to.be.eq(_activationTimestamp)
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN.mul(3))
          expect(mintedShares).to.be.equal(0)
          expect(exists).to.be.equal(true)
          expect(isActive).to.be.equal(false)
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC_BN.mul(3))
        }

        // First deposit increment
        {
          await magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address)

          const atlasDeposit = await magicDepositor.atlasDeposits(1)
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } = atlasDeposit

          expect(activationTimestamp).to.be.equal(_activationTimestamp)
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN.mul(4))
          expect(mintedShares).to.be.equal(0)
          expect(exists).to.be.equal(true)
          expect(isActive).to.be.equal(false)
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC_BN.mul(4))
        }
      })
    })

    describe('after the second month', () => {
      const depositAmount = ONE_MAGIC_BN

      const fixture = deployments.createFixture(async () => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor } = baseFixture

        await magicDepositor.connect(alice).deposit(depositAmount)
        await depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount)
        await depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount)

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        return { ...baseFixture }
      })

      it('activates the first month and initializes the second month', async () => {
        const { alice, magicDepositor, atlasMine } = await fixture()

        expect(await atlasMine.getAllUserDepositIds(magicDepositor.address)).to.have.length(0)

        // After a deposit has been accumulating user funds for one month,
        // this deposit is forwarded to the AtlasMine. This happens automatically when
        // a user tries to deposit into the contract, initializing a new accumulation deposit
        // for another month
        await magicDepositor.connect(alice).deposit(ONE_MAGIC_BN)
        expect(await atlasMine.getAllUserDepositIds(magicDepositor.address)).to.have.length(1)

        const [firstAtlasDeposit, secondAtlasDeposit] = await Promise.all([
          magicDepositor.atlasDeposits(1),
          magicDepositor.atlasDeposits(2),
        ])

        checkAtlasDepositHasBeenActivated(firstAtlasDeposit)
        checkAtlasDepositHasBeenInitialized(secondAtlasDeposit)
      })

      it('correctly computes shares', async () => {
        const { alice, mgMagicToken, magicDepositor } = await fixture()

        await expect(() => magicDepositor.connect(alice).deposit(depositAmount)).to.changeTokenBalance(
          mgMagicToken,
          magicDepositor,
          depositAmount.mul(3)
        )
      })

      it('correctly harvests magic from atlas mine', async () => {
        const { alice, magicToken, magicDepositor } = await fixture()
        await magicDepositor.connect(alice).deposit(depositAmount) // Deposit 1 is activated, Deposit 2 is init'ed

        await timeAndMine.increaseTime(ONE_DAY_IN_SECONDS)

        const [magicBalancePre, internalMagicAccountingPre] = await Promise.all([
          magicToken.balanceOf(magicDepositor.address),
          magicDepositor.heldMagic(),
        ])

        await magicDepositor.connect(alice).deposit(depositAmount)

        const [magicBalancePost, internalMagicAccountingPost, compoundedMagic] = await Promise.all([
          magicToken.balanceOf(magicDepositor.address),
          magicDepositor.heldMagic(),
          magicDepositor.harvestForNextDeposit(),
        ])

        expect(magicBalancePost.sub(depositAmount)).to.be.gte(magicBalancePre)
        // Its (harvestForNextDeposit) zero now because 50% for stakeRewards and 50% for treasury
        // expect(internalMagicAccountingPost).to.be.gte(internalMagicAccountingPre)

        const expectedCompoundedMagic = magicBalancePost.sub(magicBalancePre).sub(depositAmount)
        expect(expectedCompoundedMagic).to.gte(0)
      })
    })

    describe('after the third month', () => {
      const firstMonthDepositAmount = ONE_MAGIC_BN
      const secondMonthDepositAmount = ONE_THOUSAND_MAGIC_BN.mul(10)

      const fixture = deployments.createFixture(async () => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor } = baseFixture

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ])

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, firstMonthDepositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, firstMonthDepositAmount, true),
          depositMagicInGuild(carol, magicToken, magicDepositor, firstMonthDepositAmount, true),
        ])

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, secondMonthDepositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, secondMonthDepositAmount, true),
          depositMagicInGuild(carol, magicToken, magicDepositor, secondMonthDepositAmount, true),
        ])

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        return { ...baseFixture }
      })

      it('activates the second month and initializes third month', async () => {
        const { alice, bob, magicToken, magicDepositor } = await fixture()

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, ONE_MAGIC_BN, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, ONE_MAGIC_BN, true),
        ])

        const [firstAtlasDeposit, secondAtlasDeposit, thirdAtlasDeposit, fourthAtlasDeposit] = await Promise.all([
          magicDepositor.atlasDeposits(1),
          magicDepositor.atlasDeposits(2),
          magicDepositor.atlasDeposits(3),
          magicDepositor.atlasDeposits(4),
        ])

        expect(fourthAtlasDeposit.exists).to.be.equal(false)
        checkAtlasDepositHasBeenActivated(firstAtlasDeposit)
        checkAtlasDepositHasBeenActivated(secondAtlasDeposit)
        checkAtlasDepositHasBeenInitialized(thirdAtlasDeposit)
      })

      it('greatly increases harvest rate after second deposit is activated', async () => {
        const { alice, magicToken, magicDepositor } = await fixture()

        await magicDepositor.update()
        const harvestRatePre = (await magicDepositor.harvestForNextDeposit()).mul(PRECISION).div(ONE_MONTH_IN_SECONDS)
        expect(harvestRatePre).to.be.gte(0)

        await depositMagicInGuild(alice, magicToken, magicDepositor, ONE_MAGIC_BN, true)

        expect(await magicDepositor.harvestForNextDeposit()).to.be.equal(0)
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        await magicDepositor.update()
        const harvestRatePost = (await magicDepositor.harvestForNextDeposit()).mul(PRECISION).div(ONE_MONTH_IN_SECONDS)

        // expect(harvestRatePost).to.gt(0)
      })
    })

    describe('after the 14th month', () => {
      const depositAmount = ONE_THOUSAND_MAGIC_BN

      /** Simulates the passing of 12 months and deposits */
      const fixture = deployments.createFixture(async () => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor } = baseFixture

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ])

        for (let i = 0; i < 13; i++) {
          await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true)
          await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)
        }

        // await magicDepositor.withdrawStakeRewards()
        // await magicDepositor.withdrawTreasury()

        return { ...baseFixture }
      })

      it('correctly withdraws the first deposit and reinvests the amount', async () => {
        const { alice, magicToken, magicDepositor, atlasMine } = await fixture()

        // 5 days extra is because AtlasMine defines one year = 365 days, instead of 12 * 30
        const { lockedUntil } = await atlasMine.userInfo(magicDepositor.address, 1)
        await timeAndMine.setTimeNextBlock(lockedUntil.toNumber() + ONE_DAY_IN_SECONDS * 45 + 1)

        // Expect the first deposit to be withdrawn
        const tx = depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true)
        await expect(tx).to.emit(atlasMine, 'Withdraw').withArgs(magicDepositor.address, 1, depositAmount)

        // Expect the first deposit amount to be relocked
        const { logs } = await awaitTx(tx)
        const log = logs.find(({ topics }) => topics[0] === ethers.utils.id('Deposit(address,uint256,uint256,uint8)'))
        if (!log) throw new Error(`Deposit event was not emitted`)
        const {
          args: { amount },
        } = atlasMine.interface.parseLog(log)
        expect(amount as BigNumber).to.be.gte(depositAmount)
      })
    })

    describe('when there are no deposits for more than one month', () => {
      const depositAmount = ONE_THOUSAND_MAGIC_BN

      const fixture = deployments.createFixture(async () => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor } = baseFixture

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ])

        for (let i = 0; i < 2; i++) {
          await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true)
          await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)
        }

        // await magicDepositor.withdrawStakeRewards()
        // await magicDepositor.withdrawTreasury()

        return { ...baseFixture }
      })

      it('activates previous month and initializes a new one', async () => {
        const { alice, magicToken, magicDepositor, atlasMine } = await fixture()

        const { lockedUntil } = await atlasMine.userInfo(magicDepositor.address, 1)
        await timeAndMine.setTimeNextBlock(lockedUntil.toNumber() + ONE_DAY_IN_SECONDS * 45)

        await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true)

        const [firstAtlasDeposit, secondAtlasDeposit, thirdAtlasDeposit] = await Promise.all([
          magicDepositor.atlasDeposits(1),
          magicDepositor.atlasDeposits(2),
          magicDepositor.atlasDeposits(3),
        ])

        checkAtlasDepositHasBeenActivated(firstAtlasDeposit)
        checkAtlasDepositHasBeenActivated(secondAtlasDeposit)
        checkAtlasDepositHasBeenInitialized(thirdAtlasDeposit)
      })
    })
  })

  describe('claimMintedShares()', () => {
    const depositAmount = ONE_THOUSAND_MAGIC_BN

    const fixture = deployments.createFixture(async () => {
      const baseFixture = await BaseFixture()
      const { alice, bob, carol, magicToken, magicDepositor } = baseFixture

      for (let i = 0; i < 3; i++) {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
          depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount),
        ])
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)
      }

      await depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true)
      return { ...baseFixture }
    })

    it('rejects claims to non-existing deposits', async () => {
      const { mallory, magicDepositor } = await fixture()
      await expect(
        magicDepositor.connect(mallory).claimMintedShares(ethers.constants.MaxUint256, false)
      ).to.be.revertedWith('Deposit does not exist')
    })

    it('rejects claims to inactive deposits', async () => {
      const { mallory, magicDepositor } = await fixture()
      const lastIndex = await magicDepositor.currentAtlasDepositIndex()
      await expect(magicDepositor.connect(mallory).claimMintedShares(lastIndex, false)).to.be.revertedWith(
        'Deposit has not been activated'
      )
    })
    it('rejects claiming to deposits where the sender has not participated', async () => {
      const { mallory, magicDepositor } = await fixture()
      await expect(magicDepositor.connect(mallory).claimMintedShares(1, false)).to.be.revertedWith('Nothing to claim')
    })
    it('rejects trying to claim twice', async () => {
      const { alice, magicDepositor } = await fixture()
      await magicDepositor.connect(alice).claimMintedShares(1, false)
      await expect(magicDepositor.connect(alice).claimMintedShares(1, false)).to.be.revertedWith('Nothing to claim')
    })

    it('correctly transfer shares to the claimant', async () => {
      const { alice, bob, magicToken, mgMagicToken, magicDepositor } = await BaseFixture()
      // In first month
      {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        await expect(magicDepositor.connect(alice).claimMintedShares(1, false))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, alice.address, depositAmount)
      }

      // In second month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex()
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        const [aliceMintedShares, bobMintedShares] = await Promise.all([
          magicDepositor.connect(alice).callStatic.claimMintedShares(depositIndex, false),
          magicDepositor.connect(bob).callStatic.claimMintedShares(depositIndex, false),
        ])

        expect(aliceMintedShares).to.be.equal(bobMintedShares).and.equal(depositAmount)

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, false))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, alice.address, aliceMintedShares)
      }

      // In third month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex()
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        const [aliceMintedShares, bobMintedShares] = await Promise.all([
          magicDepositor.connect(alice).callStatic.claimMintedShares(depositIndex, false),
          magicDepositor.connect(bob).callStatic.claimMintedShares(depositIndex, false),
        ])

        expect(aliceMintedShares).to.be.equal(bobMintedShares).and.equal(depositAmount)

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, false))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, alice.address, aliceMintedShares)
      }
    })

    it('Staking mgMagic token afterClaiming', async () => {
      const { alice, bob, magicToken, mgMagicToken, magicDepositor, rewardPool } = await BaseFixture()
      // In first month
      {
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)
        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        await expect(magicDepositor.connect(alice).claimMintedShares(1, true))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, rewardPool.address, depositAmount)

        await expect(magicDepositor.connect(bob).claimMintedShares(1, true))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, rewardPool.address, depositAmount)
      }

      const stakedAlice = await rewardPool.balanceOf(alice.address)
      expect(stakedAlice).to.be.equal(depositAmount)

      const stakedbob = await rewardPool.balanceOf(bob.address)
      expect(stakedbob).to.be.equal(depositAmount)

      // In second month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex()
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, true)).to.emit(
          mgMagicToken,
          'Transfer'
        )

        await expect(magicDepositor.connect(bob).claimMintedShares(depositIndex, true))
        .to.emit(mgMagicToken, 'Transfer')

        const stakedAlice = await rewardPool.balanceOf(alice.address)
        expect(stakedAlice).to.be.equal(depositAmount.mul(2))

        const stakedbob = await rewardPool.balanceOf(bob.address)
        expect(stakedbob).to.be.equal(depositAmount.mul(2))
      }

      // In third month
      {
        const depositIndex = await magicDepositor.currentAtlasDepositIndex()
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        await Promise.all([
          depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
          depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount),
        ])

        const [aliceMintedShares, bobMintedShares] = await Promise.all([
          magicDepositor.connect(alice).callStatic.claimMintedShares(depositIndex, true),
          magicDepositor.connect(bob).callStatic.claimMintedShares(depositIndex, true),
        ])

        expect(aliceMintedShares).to.be.equal(bobMintedShares).and.equal(depositAmount)

        await expect(magicDepositor.connect(alice).claimMintedShares(depositIndex, true))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, rewardPool.address, aliceMintedShares)

          await expect(magicDepositor.connect(bob).claimMintedShares(depositIndex, true))
          .to.emit(mgMagicToken, 'Transfer')
          .withArgs(magicDepositor.address, rewardPool.address, aliceMintedShares)

        const stakedAlice = await rewardPool.balanceOf(alice.address)
        expect(stakedAlice).to.be.equal(depositAmount.mul(3))

        const stakedbob = await rewardPool.balanceOf(bob.address)
        expect(stakedbob).to.be.equal(depositAmount.mul(3))
      }
    })
  })
})
