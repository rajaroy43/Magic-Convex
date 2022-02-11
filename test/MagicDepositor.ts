import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { ethers } from 'hardhat'

const { AddressZero } = ethers.constants
describe('Test', () => {
  describe('depositFor()', () => {
    it('rejects zero inputs', async () => {
      const { alice, atlasMine, magicToken, mgMagicToken, magicDepositor } = await BaseFixture()

      await expect(magicDepositor.depositFor(0, alice.address)).to.be.revertedWith('amount cannot be 0')
      await expect(magicDepositor.depositFor(1, AddressZero)).to.be.revertedWith('cannot deposit to 0x0')
    })

    describe('when the first user deposit happens', () => {
      it('initializes the first deposit with the correct parameters')
    })

    describe('after the second month', () => {
      it('activates the first month and initializes the second month')
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
