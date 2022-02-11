import { deployments } from 'hardhat'
import {
  AtlasMine__factory,
  Counter__factory,
  IERC20__factory,
  MagicDepositor__factory,
  MgMagicToken__factory,
} from '../../typechain'

export const BaseFixture = deployments.createFixture(async ({ deployments, ethers }) => {
  const {
    AtlasMine: { address: AtlasMineAddress },
    MAGIC: { address: MagicTokenAddress },
    mgMagicToken: { address: mgMagicTokenAddress },
    MagicDepositor: { address: MagicDepositorAddress },
  } = await deployments.fixture()
  const [alice] = await ethers.getSigners()

  const atlasMine = AtlasMine__factory.connect(AtlasMineAddress, alice)
  const magicToken = IERC20__factory.connect(MagicTokenAddress, alice)
  const mgMagicToken = MgMagicToken__factory.connect(mgMagicTokenAddress, alice)
  const magicDepositor = MagicDepositor__factory.connect(MagicDepositorAddress, alice)

  return { alice, atlasMine, magicToken, mgMagicToken, magicDepositor }
})
