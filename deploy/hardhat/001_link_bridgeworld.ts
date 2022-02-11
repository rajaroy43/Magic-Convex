import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { saveContract } from '../../utils/SaveContract'
import { ATLAS_MINE_ADDRESS } from '../../utils/constants'
import { AtlasMine__factory } from '../../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { abi } = AtlasMine__factory
  await saveContract(hre, 'AtlasMine', ATLAS_MINE_ADDRESS, abi)
}
export default func
func.tags = ['AtlasMine']
