import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumberish, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { IERC20, MagicDepositor } from '../typechain'

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
  amount: BigNumberish
) {
  if (typeof amount === 'number') amount = parseEther(`${amount}`)

  await token.connect(wallet).approve(guild.address, amount)
  await guild.connect(wallet).deposit(amount)
}
