import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MAGIC_TOKEN_ADDRESS, ATLAS_MINE_ADDRESS, MG_MAGIC_TOKEN_CONTRACT_NAME } from '../../utils/constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre
  const { deployer } = await getNamedAccounts()

  const { address: mgMagicTokenAddress } = await getContract(MG_MAGIC_TOKEN_CONTRACT_NAME)

  await deploy('MagicDepositor', {
    args: [MAGIC_TOKEN_ADDRESS, ATLAS_MINE_ADDRESS, mgMagicTokenAddress],
    from: deployer,
  })
}
export default func
func.tags = ['MagicDepositor']
