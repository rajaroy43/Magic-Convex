import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  MAGIC_TOKEN_ADDRESS,
  ATLAS_MINE_ADDRESS,
  TREASURE_NFT_ADDRESS,
  LEGION_NFT_ADDRESS,
  MG_MAGIC_TOKEN_CONTRACT_NAME,
  MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG,
  XMG_MAGIC_TOKEN_CONTRACT_NAME,
} from '../../utils/constants'
import { MagicDepositor__factory, MgMagicToken } from '../../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre
  const { deployer } = await getNamedAccounts()

  const mgMagicToken = (await getContract(MG_MAGIC_TOKEN_CONTRACT_NAME)) as MgMagicToken
  const { address: xmgMagicTokenAddr } = await getContract(XMG_MAGIC_TOKEN_CONTRACT_NAME)

  const { address: magicDepositorAddress } = await deploy('MagicDepositor', {
    args: [MAGIC_TOKEN_ADDRESS, mgMagicToken.address, ATLAS_MINE_ADDRESS, TREASURE_NFT_ADDRESS, LEGION_NFT_ADDRESS],
    from: deployer,
  })

  await mgMagicToken.transferOwnership(magicDepositorAddress).then((tx) => tx.wait())

  await MagicDepositor__factory.connect(magicDepositorAddress, mgMagicToken.signer).setConfig(
    MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG.rewards,
    MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG.treasury,
    deployer,
    xmgMagicTokenAddr
  )

  hre.tracer.nameTags[magicDepositorAddress] = 'MagicDepositor'
}

export default func
func.tags = ['MagicDepositor']
