import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  RICH_USER_ADDRESS,
  MAGIC_TOKEN_ADDRESS,
  SECONDARY_RICH_USER_ADDRESS,
  ATLAS_MASTER_OF_COIN_ADDRESS,
} from '../../utils/constants'
import { IERC20__factory } from '../../typechain'
import { ethers } from 'hardhat'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { impersonate } from '../../utils/Impersonate'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const token = IERC20__factory.connect(MAGIC_TOKEN_ADDRESS, hre.ethers.provider)
  const [alice] = await ethers.getSigners()

  {
    await impersonate(RICH_USER_ADDRESS, alice, hre)
    const signer = hre.ethers.provider.getSigner(RICH_USER_ADDRESS)

    const balance = await token.balanceOf(RICH_USER_ADDRESS)
    await token.connect(signer).transfer(alice.address, balance)
  }

  {
    await impersonate(SECONDARY_RICH_USER_ADDRESS, alice, hre)

    const signer = hre.ethers.provider.getSigner(SECONDARY_RICH_USER_ADDRESS)
    const balance = await token.balanceOf(SECONDARY_RICH_USER_ADDRESS)
    console.log(await token.balanceOf(ATLAS_MASTER_OF_COIN_ADDRESS).then(formatEther))
    await token.connect(signer).transfer(ATLAS_MASTER_OF_COIN_ADDRESS, balance)
    console.log(await token.balanceOf(ATLAS_MASTER_OF_COIN_ADDRESS).then(formatEther))
  }
}
export default func
func.tags = ['fund']
