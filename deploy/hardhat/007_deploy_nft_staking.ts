import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  ATLAS_MINE_ADDRESS,
  LEGION_NFT_ADDRESS,
  TREASURE_NFT_ADDRESS
} from '../../utils/constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre
  const { deployer } = await getNamedAccounts()
  const { address: magicStakingAddress } = await deploy('MagicStaking', {
    args: [ATLAS_MINE_ADDRESS, TREASURE_NFT_ADDRESS, LEGION_NFT_ADDRESS],
    from: deployer,
  })
  hre.tracer.nameTags[magicStakingAddress] = 'MagicStaking'
}

export default func
func.tags = ['MagicStaking']
