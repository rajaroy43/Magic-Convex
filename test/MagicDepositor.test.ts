import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { ethers } from 'hardhat'
import { parseEther } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

const { AddressZero } = ethers.constants

const ONE_MAGIC = parseEther('1')

describe('Test', () => {
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
          await magicDepositor.depositFor(ONE_MAGIC, alice.address)

          expect((await magicDepositor.atlasDeposits(0)).exists).to.be.equal(false) // Deposits should start at index 1

          const atlasDeposit = await magicDepositor.atlasDeposits(1)
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } = atlasDeposit
          _activationTimestamp = activationTimestamp // Save for later checks

          expect(activationTimestamp).to.be.gt(0)
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC)
          expect(mintedShares).to.be.equal(0)
          expect(exists).to.be.equal(true)
          expect(isActive).to.be.equal(false)
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC)
        }

        // Secondary user deposit
        {
          await magicToken.connect(bob).approve(magicDepositor.address, ethers.constants.MaxUint256)
          await magicDepositor.connect(bob).depositFor(ONE_MAGIC.mul(2), bob.address)

          expect((await magicDepositor.atlasDeposits(2)).exists).to.be.equal(false)

          const atlasDeposit = await magicDepositor.atlasDeposits(1)
          const { activationTimestamp, accumulatedMagic, mintedShares, exists, isActive } = atlasDeposit

          expect(activationTimestamp).to.be.eq(_activationTimestamp)
          expect(accumulatedMagic).to.be.equal(ONE_MAGIC.mul(3))
          expect(mintedShares).to.be.equal(0)
          expect(exists).to.be.equal(true)
          expect(isActive).to.be.equal(false)
          expect(await magicToken.balanceOf(magicDepositor.address)).to.be.equal(ONE_MAGIC.mul(3))
        }
      })
    })

    describe('after the second month', () => {
      it('activates the first month and initializes the second month', async () => {})
      it('can move forward to the third month')
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
    it('transfers the shares to the claimant')
    it('rejects trying to claim twice')
  })
})
