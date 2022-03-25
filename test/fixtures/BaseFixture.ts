import { deployments } from 'hardhat'
import {
  AtlasMine__factory,
  IERC1155__factory,
  IERC20__factory,
  IERC721__factory,
  MagicDepositor__factory,
  MagicStaking__factory,
  MgMagicToken__factory,
} from '../../typechain'
import { LEGION_NFT_ADDRESS, TREASURE_NFT_ADDRESS } from '../../utils/constants'
export const BaseFixture = deployments.createFixture(async ({ deployments, ethers }) => {
  const {
    AtlasMine: { address: AtlasMineAddress },
    MAGIC: { address: MagicTokenAddress },
    mgMagicToken: { address: mgMagicTokenAddress },
    MagicDepositor: { address: MagicDepositorAddress },
    MagicStaking: { address: MagicStakingAddress },
  } = await deployments.fixture()
  const [alice, bob, carol, dave, mallory] = await ethers.getSigners()
  const secondaryUsers = [bob, carol, dave]

  const atlasMine = AtlasMine__factory.connect(AtlasMineAddress, alice)
  const magicToken = IERC20__factory.connect(MagicTokenAddress, alice)
  const mgMagicToken = MgMagicToken__factory.connect(mgMagicTokenAddress, alice)
  const magicDepositor = MagicDepositor__factory.connect(MagicDepositorAddress, alice)
  const magicStaking = MagicStaking__factory.connect(MagicStakingAddress, alice)
  const treasure = IERC1155__factory.connect(TREASURE_NFT_ADDRESS, alice)
  const legion = IERC721__factory.connect(LEGION_NFT_ADDRESS, alice)
  const [stakeRewardSplit, treasurySplit, treasuryAddress, stakingAddress] = await magicDepositor.getConfig()

  const split = await magicToken.balanceOf(alice.address).then((n) => n.div(secondaryUsers.length + 1))

  for (const user of secondaryUsers) {
    await magicToken.transfer(user.address, split)
  }

  await magicToken.approve(magicDepositor.address, ethers.constants.MaxUint256)
  return {
    alice,
    bob,
    carol,
    dave,
    mallory,
    atlasMine,
    magicToken,
    mgMagicToken,
    magicDepositor,
    stakeRewardSplit,
    treasurySplit,
    magicStaking,
    treasuryAddress,
    stakingAddress,
    treasure,
    legion,
  }
})
