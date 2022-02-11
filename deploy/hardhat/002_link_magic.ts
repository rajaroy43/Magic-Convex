import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { saveContract } from '../../utils/SaveContract'
import { MAGIC_TOKEN_ADDRESS } from '../../utils/constants'
import { IERC20__factory } from '../../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { abi } = IERC20__factory
  await saveContract(hre, 'MAGIC', MAGIC_TOKEN_ADDRESS, abi)
}
export default func
func.tags = ['MAGIC']
