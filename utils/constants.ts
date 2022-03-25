import { parseEther } from 'ethers/lib/utils'

/**
 * Arbitrum forking, needed for tests
 */
export const ATLAS_MINE_ADDRESS = '0xA0A89db1C899c49F98E6326b764BAFcf167fC2CE'
export const ATLAS_MINE_IMPLEMENTATION_ADDRESS = '0xc71e6725569af73ac6641ec4bcc99a709ead40c7'
export const ATLAS_MASTER_OF_COIN_ADDRESS = '0x3563590e19d2b9216e7879d269a04ec67ed95a87'
export const ATLAS_MASTER_OF_COIN_ROLE = '0x275f12656528ceae7cba2736a15cb4ce098fc404b67e9825ec13a82aaf8fabec'
export const MAGIC_TOKEN_ADDRESS = '0x539bde0d7dbd336b79148aa742883198bbf60342'
export const LEGION_NFT_ADDRESS = '0xfE8c1ac365bA6780AEc5a985D989b327C27670A1'
export const TREASURE_NFT_ADDRESS = '0xEBba467eCB6b21239178033189CeAE27CA12EaDf'
export const RICH_USER_ADDRESS = '0xfd7a5c211ac4a00182aba2e92e1ccb0daacf8ab0'
export const SECONDARY_RICH_USER_ADDRESS = '0xb7e50106a5bd3cf21af210a755f9c8740890a8c9'
export const ARBITRUM_BLOCK_GAS_LIMIT = 200_000_000

/**
 * Contract names
 */
export const PR_MAGIC_TOKEN_CONTRACT_NAME = 'prMagicToken'
export const XMG_MAGIC_TOKEN_CONTRACT_NAME = 'xmgMagicToken'
export const MAGIC_DEPOSITOR_CONTRACT_NAME = 'MagicDepositor'
export const MAGIC_STAKING_CONTRACT_NAME = 'MagicStaking'
export const REWARD_POOL_CONTRACT_NAME = 'RewardPool'

/**
 * Some unit variables
 */
export const ONE_MONTH_IN_SECONDS = 30 * 24 * 60 * 60
export const FORTY_FIVE_DAYS_IN_SECONDS = 45 * 24 * 60 * 60
export const ONE_DAY_IN_SECONDS = 24 * 3600
export const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60

export const ONE_MAGIC_BN = parseEther('1')
export const ONE_THOUSAND_MAGIC_BN = parseEther('1000')
export const TEN_MILLION_MAGIC_BN = parseEther('10000000')

export const PRECISION = parseEther('1')

export const ONE_TREAUSRE = 1
export const TREASURE_TOKEN_IDS = [117,133,151,73]
export const ONE_LEGION = 1
export const LEGION_TOKEN_IDS = [25855,25856,25857,25858]

/**
 * Configuration of Magic Depositor
 */
export const MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG = {
  treasury: parseEther('0.5'), // 50% of harvested amounts will go to treasury
  rewards: parseEther('0.5'), // 50% of harvested amounts will go to user rewards
  // the rest (0%) will be kept by the MagicDepositor to be auto-compounded
}
