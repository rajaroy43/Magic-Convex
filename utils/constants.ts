import { parseEther } from 'ethers/lib/utils'

/**
 * Arbitrum forking, needed for tests
 */
export const ATLAS_MINE_ADDRESS = '0xA0A89db1C899c49F98E6326b764BAFcf167fC2CE'
export const ATLAS_MINE_IMPLEMENTATION_ADDRESS = '0xc71e6725569af73ac6641ec4bcc99a709ead40c7'
export const ATLAS_MASTER_OF_COIN_ADDRESS = '0x3563590e19d2b9216e7879d269a04ec67ed95a87'
export const MAGIC_TOKEN_ADDRESS = '0x539bde0d7dbd336b79148aa742883198bbf60342'
export const RICH_USER_ADDRESS = '0x482729215AAF99B3199E41125865821ed5A4978a'
export const SECONDARY_RICH_USER_ADDRESS = '0xb7e50106a5bd3cf21af210a755f9c8740890a8c9'
/**
 * Contract names
 */
export const MG_MAGIC_TOKEN_CONTRACT_NAME = 'mgMagicToken'
export const XMG_MAGIC_TOKEN_CONTRACT_NAME = 'xmgMagicToken'
export const MAGIC_DEPOSITOR_CONTRACT_NAME = 'MagicDepositor'

/**
 * Some unit variables
 */
export const ONE_MONTH_IN_SECONDS = 30 * 24 * 60 * 60
export const FORTY_FIVE_DAYS_IN_SECONDS = 45 * 24 * 60 * 60
export const ONE_DAY_IN_SECONDS = 24 * 3600

export const ONE_MAGIC_BN = parseEther('1')
export const THOUSAND_MAGIC_BN = parseEther('1000')

export const PRECISION = parseEther('1')

/**
 * Configuration of Magic Depositor
 */
export const MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG = {
  treasury: parseEther('0.25'), // 25% of harvested amounts will go to treasury
  rewards: parseEther('0.25'), // 25% of harvested amounts will go to user rewards
  // the rest (50%) will be kept by the MagicDepositor to be auto-compounded
}
