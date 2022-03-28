import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { PR_MAGIC_TOKEN_CONTRACT_NAME, XMG_MAGIC_TOKEN_CONTRACT_NAME } from '../../utils/constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre
  const { deployer } = await getNamedAccounts()

  await deploy(XMG_MAGIC_TOKEN_CONTRACT_NAME, {
    from: deployer,
    args: [(await getContract(PR_MAGIC_TOKEN_CONTRACT_NAME)).address],
  })
}
export default func
func.tags = ['prMagic']
