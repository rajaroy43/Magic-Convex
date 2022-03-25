import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  MAGIC_TOKEN_ADDRESS,
  ATLAS_MINE_ADDRESS,
  PR_MAGIC_TOKEN_CONTRACT_NAME,
  MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG,
  REWARD_POOL_CONTRACT_NAME,
} from '../../utils/constants'
import { MagicDepositor__factory,  PrMagicToken} from '../../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre
  const { deployer } = await getNamedAccounts()

  const prMagicToken = (await getContract(PR_MAGIC_TOKEN_CONTRACT_NAME)) as PrMagicToken
  const args = [MAGIC_TOKEN_ADDRESS, prMagicToken.address, ATLAS_MINE_ADDRESS]
  const { address: magicDepositorAddress } = await deploy('MagicDepositor', {
    args : args,
    from: deployer,
  })

  await prMagicToken.transferOwnership(magicDepositorAddress).then((tx) => tx.wait())

  hre.tracer.nameTags[magicDepositorAddress] = 'MagicDepositor'
}

export default func
func.tags = ['MagicDepositor']