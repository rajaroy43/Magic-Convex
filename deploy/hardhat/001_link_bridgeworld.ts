import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { saveContract } from '../../utils/SaveContract'
import { ATLAS_MINE_ADDRESS, ATLAS_MINE_IMPLEMENTATION_ADDRESS } from '../../utils/constants'
import { AtlasMine__factory } from '../../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { abi } = AtlasMine__factory

  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre
  const { deployer } = await getNamedAccounts()

  const { deployedBytecode } = await deploy('AtlasMine', { from: deployer })
  if (!deployedBytecode) throw new Error('AtlasMine debug implementation could not be deployed')

  await hre.network.provider.send('hardhat_setCode', [ATLAS_MINE_IMPLEMENTATION_ADDRESS, deployedBytecode])
  await saveContract(hre, 'AtlasMine', ATLAS_MINE_ADDRESS, abi)
}
export default func
func.tags = ['AtlasMine']
