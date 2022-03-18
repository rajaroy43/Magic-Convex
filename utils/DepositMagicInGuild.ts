import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumberish, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { IERC20, MagicDepositor } from '../typechain'
import { ARBITRUM_BLOCK_GAS_LIMIT } from './constants'

/**
 *
 * @param token => expects to have signer connected
 * @param guild => expects to have signer connected
 * @param amount
 */
export async function depositMagicInGuild(
  wallet: SignerWithAddress | Wallet,
  token: IERC20,
  guild: MagicDepositor,
  amount: BigNumberish,
  alreadyApproved = false
) {
  if (typeof amount === 'number') amount = parseEther(`${amount}`)

  if (!alreadyApproved) await token.connect(wallet).approve(guild.address, amount)
  return await guild.connect(wallet).deposit(amount, { gasLimit: ARBITRUM_BLOCK_GAS_LIMIT })
}
