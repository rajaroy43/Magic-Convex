import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MG_MAGIC_TOKEN_CONTRACT_NAME } from '../../utils/constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre
  const { deployer } = await getNamedAccounts()

  const { address } = await deploy(MG_MAGIC_TOKEN_CONTRACT_NAME, { from: deployer })
  hre.tracer.nameTags[address] = 'mgMagic'
}
export default func
func.tags = ['mgMagic']
