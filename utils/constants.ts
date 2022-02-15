import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

export const ATLAS_MINE_ADDRESS = '0xA0A89db1C899c49F98E6326b764BAFcf167fC2CE'
export const MAGIC_TOKEN_ADDRESS = '0x539bde0d7dbd336b79148aa742883198bbf60342'
export const RICH_USER_ADDRESS = '0xd9e13C8a720840cC091Fde101362dD84f2cdFF35'

export const MG_MAGIC_TOKEN_CONTRACT_NAME = 'mgMagicToken'
export const XMG_MAGIC_TOKEN_CONTRACT_NAME = 'xmgMagicToken'
export const MAGIC_DEPOSITOR_CONTRACT_NAME = 'MagicDepositor'

export const ONE_MONTH_IN_SECONDS = 30 * 24 * 60 * 60
export const FORTY_FIVE_DAYS_IN_SECONDS = 45 * 24 * 60 * 60
export const ONE_DAY_IN_SECONDS = 24 * 3600

export const MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG = {
  treasury: parseEther('0.25'), // 25% of harvested amounts will go to treasury
  rewards: parseEther('0.25'), // 25% of harvested amounts will go to user rewards
  // the rest (50%) will be kept by the MagicDepositor to be auto-compounded
}
