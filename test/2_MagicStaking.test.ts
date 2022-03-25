import { expect } from 'chai'
import { BaseFixture } from './fixtures/BaseFixture'
import { BigNumber, Wallet } from 'ethers'
import {
  ATLAS_MINE_ADDRESS,
  TREASURE_NFT_ADDRESS,
  LEGION_NFT_ADDRESS,
  ONE_LEGION,
  ONE_TREAUSRE,
  TREASURE_TOKEN_IDS,
  LEGION_TOKEN_IDS,
} from '../utils/constants'
import { stakeLegion, stakeTreasures, unStakeLegion, unStakeTreasures } from '../utils/MagicNftStaking'
import { AtlasMine, IERC1155, IERC721, MagicStaking } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('MagicStaking', () => {
  it('Magic staking Initialized', async () => {
    const { magicStaking } = await BaseFixture()
    const legionAddress = await magicStaking.legion()
    const treasureAddress = await magicStaking.treasure()
    const atlasmineAddress = await magicStaking.atlasMine()
    expect(legionAddress).to.be.equal(LEGION_NFT_ADDRESS)
    expect(treasureAddress).to.be.equal(TREASURE_NFT_ADDRESS)
    expect(atlasmineAddress).to.be.equal(ATLAS_MINE_ADDRESS)
  })
  describe('Treasure Staking/Unstaking/Withdrawing', () => {
    const checkSTakedTreasure = async (
      wallet: Wallet | SignerWithAddress,
      magicStaking: MagicStaking,
      treasure: IERC1155,
      atlasMine: AtlasMine,
      TREASURE_TOKEN_ID: number,
      treasureBoost: BigNumber,
      stakedTreasureAmount: number,
      totalStaked: number
    ) => {
      await expect(stakeTreasures(wallet, treasure, magicStaking, TREASURE_TOKEN_ID, stakedTreasureAmount, '0x', true))
        .to.emit(atlasMine, 'Staked')
        .withArgs(treasure.address, TREASURE_TOKEN_ID, stakedTreasureAmount, treasureBoost)

      expect(await atlasMine.treasureStaked(magicStaking.address, TREASURE_TOKEN_ID)).to.be.equal(stakedTreasureAmount)

      expect(await atlasMine.treasureStakedAmount(magicStaking.address)).to.be.equal(totalStaked)
    }

    const checkUnSTakedTreasure = async (
      wallet: Wallet | SignerWithAddress,
      magicStaking: MagicStaking,
      treasure: IERC1155,
      atlasMine: AtlasMine,
      TREASURE_TOKEN_ID: number,
      treasureBoost: BigNumber,
      unStakedTreasureAmount: number,
      specificTreasureAmount_With_TreasureTokenId: number,
      afterUnstakingTotalStakedTreasure: number
    ) => {
      await expect(unStakeTreasures(wallet, treasure, magicStaking, TREASURE_TOKEN_ID, unStakedTreasureAmount))
        .to.emit(atlasMine, 'Unstaked')
        .withArgs(treasure.address, TREASURE_TOKEN_ID, unStakedTreasureAmount, treasureBoost)

      expect(await atlasMine.treasureStaked(magicStaking.address, TREASURE_TOKEN_ID)).to.be.equal(
        specificTreasureAmount_With_TreasureTokenId
      )

      expect(await atlasMine.treasureStakedAmount(magicStaking.address)).to.be.equal(afterUnstakingTotalStakedTreasure)
    }

    it('Staking Treasure', async () => {
      const { alice, magicStaking, treasure, atlasMine } = await BaseFixture()
      const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0]
      const stakedTreasureAmount = ONE_TREAUSRE
      const totalStaked = stakedTreasureAmount
      const treasureBoost = await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, ONE_TREAUSRE)
      await checkSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID,
        treasureBoost,
        stakedTreasureAmount,
        totalStaked
      )
    })

    it('Staking 2 treasure', async () => {
      const { alice, magicStaking, treasure, atlasMine } = await BaseFixture()
      const TREASURE_TOKEN_ID_0 = TREASURE_TOKEN_IDS[0]
      const stakedTreasureAmount = ONE_TREAUSRE
      const totalStaked = stakedTreasureAmount
      const treasureBoost = await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID_0, stakedTreasureAmount)
      await checkSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID_0,
        treasureBoost,
        stakedTreasureAmount,
        totalStaked
      )
      const contractBoost = await atlasMine.boosts(magicStaking.address)
      const TREASURE_TOKEN_ID_1 = TREASURE_TOKEN_IDS[1]
      const treasureBoost1 = (
        await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID_1, stakedTreasureAmount)
      ).add(contractBoost)

      const totalStaked1 = stakedTreasureAmount * 2
      await checkSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID_1,
        treasureBoost1,
        stakedTreasureAmount,
        totalStaked1
      )
    })

    it('UnStaking Treasure', async () => {
      const { alice, treasure, magicStaking, atlasMine } = await BaseFixture()
      const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0]
      const stakedTreasureAmount = ONE_TREAUSRE
      const totalStaked = stakedTreasureAmount
      const treasureBoost = await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, ONE_TREAUSRE)
      await checkSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID,
        treasureBoost,
        stakedTreasureAmount,
        totalStaked
      )

      const unStakedTreasureAmount = ONE_TREAUSRE
      const afterUnstakingTotalAmount = totalStaked - stakedTreasureAmount
      const specificTreasureAmount_With_TreasureTokenId = stakedTreasureAmount - unStakedTreasureAmount
      const contractBoost = await atlasMine.boosts(magicStaking.address)
      const treasureBoost1 = contractBoost.sub(
        await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, stakedTreasureAmount)
      )
      await checkUnSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID,
        treasureBoost1,
        unStakedTreasureAmount,
        specificTreasureAmount_With_TreasureTokenId,
        afterUnstakingTotalAmount
      )
    })

    it('UnStaking 2 Treasureres', async () => {
      const { alice, treasure, magicStaking, atlasMine } = await BaseFixture()
      const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0]
      const stakedTreasureAmount = ONE_TREAUSRE
      const totalStaked = stakedTreasureAmount
      const treasureBoost = await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, stakedTreasureAmount)
      await checkSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID,
        treasureBoost,
        stakedTreasureAmount,
        totalStaked
      )

      const TREASURE_TOKEN_ID1 = TREASURE_TOKEN_IDS[1]
      const stakedTreasureAmount1 = ONE_TREAUSRE
      const totalStaked1 = totalStaked + stakedTreasureAmount1
      const contractBoost = await atlasMine.boosts(magicStaking.address)
      const treasureBoost1 = contractBoost.add(
        await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID1, stakedTreasureAmount1)
      )
      await checkSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID1,
        treasureBoost1,
        stakedTreasureAmount1,
        totalStaked1
      )

      const unStakedTreasureAmount = ONE_TREAUSRE
      const specificTreasureAmount_With_TreasureTokenId = totalStaked - unStakedTreasureAmount
      const afterUnstakingTotalStakedAmount = totalStaked1 - unStakedTreasureAmount
      const contractBoost1 = await atlasMine.boosts(magicStaking.address)
      const treasureBoost2 = contractBoost1.sub(
        await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID, unStakedTreasureAmount)
      )
      await checkUnSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID,
        treasureBoost2,
        unStakedTreasureAmount,
        specificTreasureAmount_With_TreasureTokenId,
        afterUnstakingTotalStakedAmount
      )

      const unStakedTreasureAmount1 = ONE_TREAUSRE
      const specificTreasureAmount_With_TreasureTokenId1 = totalStaked - unStakedTreasureAmount1
      const afterUnstakingTotalStakedAmount1 = afterUnstakingTotalStakedAmount - unStakedTreasureAmount1
      const contractBoost2 = await atlasMine.boosts(magicStaking.address)
      const treasureBoost3 = contractBoost2.sub(
        await atlasMine.getNftBoost(treasure.address, TREASURE_TOKEN_ID1, unStakedTreasureAmount1)
      )
      await checkUnSTakedTreasure(
        alice,
        magicStaking,
        treasure,
        atlasMine,
        TREASURE_TOKEN_ID1,
        treasureBoost3,
        unStakedTreasureAmount1,
        specificTreasureAmount_With_TreasureTokenId1,
        afterUnstakingTotalStakedAmount1
      )
    })

    it('Withdrawing Treasurer', async () => {
      //Let only transfer nft to magic staking contract and then withdraw it
      const { alice, treasure, magicStaking, atlasMine } = await BaseFixture()
      const TREASURE_TOKEN_ID = TREASURE_TOKEN_IDS[0]
      const amount = ONE_TREAUSRE
      await treasure
        .connect(alice)
        .safeTransferFrom(alice.address, magicStaking.address, TREASURE_TOKEN_ID, amount, '0x')

      //Withdrawing Treasure Back

      await magicStaking.withdrawERC1155(treasure.address, alice.address, TREASURE_TOKEN_ID, amount)
    })
  })

  describe('Legions Staking/Unstaking/Withdrawing', () => {
    const checkStakedLegion = async (
      alice: Wallet | SignerWithAddress,
      magicStaking: MagicStaking,
      legion: IERC721,
      atlasMine: AtlasMine,
      LEGION_TOKEN_ID: number,
      legionBoost: BigNumber,
      afterStakingLegionAmount: number[]
    ) => {
      await expect(stakeLegion(alice, legion, magicStaking, LEGION_TOKEN_ID, true))
        .to.emit(atlasMine, 'Staked')
        .withArgs(legion.address, LEGION_TOKEN_ID, 1, legionBoost)
      const stakedLegions = (await atlasMine.getStakedLegions(magicStaking.address)).map((value) => value.toNumber())
      expect(stakedLegions).to.deep.equal(afterStakingLegionAmount)
    }

    const checkUnStakedLegion = async (
      alice: Wallet | SignerWithAddress,
      magicStaking: MagicStaking,
      legion: IERC721,
      atlasMine: AtlasMine,
      LEGION_TOKEN_ID: number,
      legionBoost: BigNumber,
      afterStakingLegionAmount: number[]
    ) => {
      await expect(unStakeLegion(alice, legion, magicStaking, LEGION_TOKEN_ID))
        .to.emit(atlasMine, 'Unstaked')
        .withArgs(legion.address, LEGION_TOKEN_ID, 1, legionBoost)
      const stakedLegions = (await atlasMine.getStakedLegions(magicStaking.address)).map((value) => value.toNumber())
      expect(stakedLegions).to.deep.equal(afterStakingLegionAmount)
    }

    it('Staking Legions', async () => {
      const { alice, magicStaking, legion, atlasMine } = await BaseFixture()
      const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0]
      const legionBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, ONE_LEGION)
      const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0]

      await checkStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_0,
        legionBoost,
        afterStakingLegionAmount
      )
    })

    it('Staking 2  Legion', async () => {
      const { alice, magicStaking, legion, atlasMine } = await BaseFixture()
      const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0]
      const legionBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, ONE_LEGION)
      const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0]

      await checkStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_0,
        legionBoost,
        afterStakingLegionAmount
      )

      const contractBoost = await atlasMine.boosts(magicStaking.address)
      const LEGION_TOKEN_ID_1 = LEGION_TOKEN_IDS[1]
      const legionBoost1 = (await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_1, ONE_LEGION)).add(
        contractBoost
      )
      const afterStakingLegionAmount1: number[] = [LEGION_TOKEN_ID_0, LEGION_TOKEN_ID_1]

      await checkStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_1,
        legionBoost1,
        afterStakingLegionAmount1
      )
    })

    it('UnStaking Legion', async () => {
      const { alice, magicStaking, legion, atlasMine } = await BaseFixture()
      const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0]
      const legionBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, ONE_LEGION)
      const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0]

      await checkStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_0,
        legionBoost,
        afterStakingLegionAmount
      )

      const afterUnstakingTotalAmount: number[] = []
      const contractBoost = await atlasMine.boosts(magicStaking.address)
      const legionBoost1 = contractBoost.sub(
        await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, 0) //no use of passing amount here
      )
      await checkUnStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_0,
        legionBoost1,
        afterUnstakingTotalAmount
      )
    })

    it('UnStaking 2  Legion', async () => {
      const { alice, magicStaking, legion, atlasMine } = await BaseFixture()
      const LEGION_TOKEN_ID_0 = LEGION_TOKEN_IDS[0]
      const legionBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, ONE_LEGION)
      const afterStakingLegionAmount: number[] = [LEGION_TOKEN_ID_0]

      await checkStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_0,
        legionBoost,
        afterStakingLegionAmount
      )

      const LEGION_TOKEN_ID_1 = LEGION_TOKEN_IDS[1]
      const contractBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_1, 0) //no use of passing amount here
      const legionBoost1 = (await atlasMine.boosts(magicStaking.address)).add(contractBoost)
      const afterStakingLegionAmount1: number[] = [LEGION_TOKEN_ID_0, LEGION_TOKEN_ID_1]

      await checkStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_1,
        legionBoost1,
        afterStakingLegionAmount1
      )

      const afterUnstakingTotalAmount: number[] = [LEGION_TOKEN_ID_1]
      const contractBoost1 = await atlasMine.boosts(magicStaking.address)
      const legionBoost2 = contractBoost1.sub(
        await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_0, 0) //no use of passing amount here, so put 0
      )
      await checkUnStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_0,
        legionBoost2,
        afterUnstakingTotalAmount
      )

      const afterUnstakingTotalAmount1: number[] = []
      const contractBoost2 = await atlasMine.boosts(magicStaking.address)
      const legionBoost3 = contractBoost2.sub(
        await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_ID_1, 0) //no use of passing amount here
      )
      await checkUnStakedLegion(
        alice,
        magicStaking,
        legion,
        atlasMine,
        LEGION_TOKEN_ID_1,
        legionBoost3,
        afterUnstakingTotalAmount1
      )
    })

    it('Withdrawing Legion', async () => {
      //Let only transfer nft to magic staking contract and then withdraw it
      const { alice, legion, magicStaking, atlasMine } = await BaseFixture()
      const LEGION_TOKEN_ID = LEGION_TOKEN_IDS[0]

      await legion.connect(alice).transferFrom(alice.address, magicStaking.address, LEGION_TOKEN_ID)

      //Withdrawing Legion Back

      await magicStaking.withdrawERC721(legion.address, alice.address, LEGION_TOKEN_ID)
    })
  })
})
