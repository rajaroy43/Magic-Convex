import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { deployments, ethers, timeAndMine } from 'hardhat'
import { parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import { depositMagicInGuild } from '../utils/DepositMagicInGuild'
import {
  ONE_DAY_IN_SECONDS,
  ONE_MAGIC_BN,
  ONE_MONTH_IN_SECONDS,
  PRECISION,
  THOUSAND_MAGIC_BN,
} from '../utils/constants'

const { AddressZero } = ethers.constants

describe('MagicDepositor', () => {
  async function checkAtlasDepositHasBeenInitialized(atlasDeposit: any) {
    expect(atlasDeposit.activationTimestamp).to.be.gt(0)
    expect(atlasDeposit.accumulatedMagic).to.be.gt(0)
    expect(atlasDeposit.mintedShares).to.be.equal(0)
    expect(atlasDeposit.exists).to.be.equal(true)
    expect(atlasDeposit.isActive).to.be.equal(false)
  }

  async function checkAtlasDepositHasBeenActivated(atlasDeposit: any) {
    expect(atlasDeposit.exists).to.be.equal(true)
    expect(atlasDeposit.isActive).to.be.equal(true)
    expect(atlasDeposit.mintedShares).to.be.gt(0)
  }

  describe('depositFor()', () => {
    it('rejects zero inputs', async () => {
      const { alice, atlasMine, magicToken, mgMagicToken, magicDepositor } = await BaseFixture()

      await expect(magicDepositor.depositFor(0, alice.address)).to.be.revertedWith('amount cannot be 0')
      await expect(magicDepositor.depositFor(1, AddressZero)).to.be.revertedWith('cannot deposit for 0x0')
    })

    describe('when the first user deposit happens', () => {
      it('initializes the first deposit with the correct parameters', async () => {
        const { alice, bob, carol, magicToken, magicDepositor } = await BaseFixture()

        let _activationTimestamp: BigNumber

        // First ever user deposit
        {
          await magicDepositor.connect(alice).depositFor(ONE_MAGIC_BN, alice.address)

          expect((await magicDepositor.atlasDeposits(0)).exists).to.be.equal(false) // Deposits should start at index 1

          const atlasDeposit = await magicDepositor.atlasDeposits(1)
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } = atlasDeposit
          _activationTimestamp = activationTimestamp // Save for later checks

          checkAtlasDepositHasBeenInitialized(atlasDeposit)
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC_BN)
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC_BN)
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

      const fixture = deployments.createFixture(async (hre) => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor, atlasMine } = baseFixture

        await magicDepositor.connect(alice).deposit(depositAmount)
        await depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount)
        await depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount)

        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS + 1)

        return { ...baseFixture }
      })

      it('activates the first month and initializes the second month', async () => {
        const { alice, bob, carol, magicToken, magicDepositor, atlasMine } = await fixture()

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
        const { alice, bob, carol, magicToken, mgMagicToken, magicDepositor, atlasMine } = await fixture()

        await expect(() => magicDepositor.connect(alice).deposit(depositAmount)).to.changeTokenBalance(
          mgMagicToken,
          magicDepositor,
          depositAmount.mul(3)
        )
      })

      it('correctly harvests magic from atlas mine', async () => {
        const { alice, bob, carol, magicToken, mgMagicToken, magicDepositor, atlasMine } = await fixture()
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

        expect(magicBalancePost.sub(depositAmount)).to.be.gt(magicBalancePre)
        expect(internalMagicAccountingPost).to.be.gt(internalMagicAccountingPre)

        const expectedCompoundedMagic = magicBalancePost.sub(magicBalancePre).sub(depositAmount).div(2) // Divided by two because ~half of the harvested magic goes into the contract
        expect(compoundedMagic).to.be.gte(expectedCompoundedMagic.sub(3)).lte(expectedCompoundedMagic.add(3)) // Substraction and addition account for rounding errors
      })
    })

    describe('after the third month', () => {
      const firstMonthDepositAmount = ONE_MAGIC_BN
      const secondMonthDepositAmount = THOUSAND_MAGIC_BN.mul(10)

      const fixture = deployments.createFixture(async (hre) => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor, atlasMine } = baseFixture

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
        const { alice, bob, carol, magicToken, mgMagicToken, magicDepositor, atlasMine } = await fixture()

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
        const { alice, bob, carol, magicToken, mgMagicToken, magicDepositor, atlasMine } = await fixture()

        await magicDepositor.update()
        const harvestRatePre = (await magicDepositor.harvestForNextDeposit()).mul(PRECISION).div(ONE_MONTH_IN_SECONDS)
        expect(harvestRatePre).to.be.gt(0)

        await depositMagicInGuild(alice, magicToken, magicDepositor, ONE_MAGIC_BN, true)

        expect(await magicDepositor.harvestForNextDeposit()).to.be.equal(0)
        await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS)

        await magicDepositor.update()
        const harvestRatePost = (await magicDepositor.harvestForNextDeposit()).mul(PRECISION).div(ONE_MONTH_IN_SECONDS)

        // Since the new deposits increase magic by ~100 times, expect to have x50 in harvest rate
        expect(harvestRatePost).to.be.gt(harvestRatePre.mul(50))
      })
    })

    describe('after the 14th month', () => {
      const depositAmount = THOUSAND_MAGIC_BN

      const fixture = deployments.createFixture(async (hre) => {
        const baseFixture = await BaseFixture()
        const { alice, bob, carol, magicToken, magicDepositor, atlasMine } = baseFixture

        await Promise.all([
          magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256),
          magicToken.connect(carol).approve(magicDepositor.address, ethers.constants.MaxUint256),
        ])

        for (let i = 0; i < 13; i++) {
          await Promise.all([
            depositMagicInGuild(alice, magicToken, magicDepositor, depositAmount, true),
            depositMagicInGuild(bob, magicToken, magicDepositor, depositAmount, true),
            depositMagicInGuild(carol, magicToken, magicDepositor, depositAmount, true),
          ])

          await timeAndMine.increaseTime(ONE_MONTH_IN_SECONDS)
        }

        await magicDepositor.withdrawStakeRewards()
        await magicDepositor.withdrawTreasury()

        return { ...baseFixture }
      })

      it('correctly withdraws the first deposit', async () => {
        const { alice, bob, carol, magicToken, mgMagicToken, magicDepositor, atlasMine } = await fixture()
      })
    })

    describe('when there are no deposits for more than one month', () => {
      it('activates previous month and initializes a new one')
    })

    describe('when 1 year + 45 days have passed since the first atlas mine deposit', () => {
      it('correctly withdraws the position and reinvests the locked amount')
    })
  })

  describe('claimMintedShares()', () => {
    it('rejects claims to non-existing deposits')
    it('rejects claims to inactive deposits')
    it('rejects claiming to deposits where the sender has not participated')
    it('rejects trying to claim twice')
    describe('correctly transfer shares to the claimant', () => {
      it('in first month')
      it('in second month')
      it('in third month')
    })
  })
})
