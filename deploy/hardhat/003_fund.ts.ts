import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { RICH_USER_ADDRESS, MAGIC_TOKEN_ADDRESS } from '../../utils/constants'
import { IERC20__factory } from '../../typechain'
import { ethers } from 'hardhat'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [RICH_USER_ADDRESS],
  })
  const signer = hre.ethers.provider.getSigner(RICH_USER_ADDRESS)

  const [alice] = await ethers.getSigners()
  const token = IERC20__factory.connect(MAGIC_TOKEN_ADDRESS, hre.ethers.provider)
  const balance = await token.balanceOf(RICH_USER_ADDRESS)
  await token.connect(signer).transfer(alice.address, balance)
}
export default func
func.tags = ['fund']
