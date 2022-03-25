import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  MAGIC_TOKEN_ADDRESS,
  MAGIC_DEPOSITOR_CONTRACT_NAME,
  REWARD_POOL_CONTRACT_NAME,
  PR_MAGIC_TOKEN_CONTRACT_NAME,
  MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG,
} from '../../utils/constants'
import { MagicDepositor, MagicDepositor__factory } from '../../typechain'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre
  const { deployer } = await getNamedAccounts()


  const magicDepositor = await getContract(MAGIC_DEPOSITOR_CONTRACT_NAME) as MagicDepositor
  const {address:magicDepositorAddress,signer} = magicDepositor
  const { address: prMagicTokenAddr } = await getContract(PR_MAGIC_TOKEN_CONTRACT_NAME)
  const args = [prMagicTokenAddr, MAGIC_TOKEN_ADDRESS, magicDepositorAddress,magicDepositorAddress];
   const { address: rewardPoolAddress } = await deploy(REWARD_POOL_CONTRACT_NAME, {
     args: args,
     from: deployer,
   })

   await MagicDepositor__factory.connect(magicDepositorAddress,signer).setConfig(
    MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG.rewards,
    MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG.treasury,
    deployer,
    rewardPoolAddress
  )

  hre.tracer.nameTags[rewardPoolAddress] = 'RewardPool'
}

export default func
func.tags = ['RewardPool']