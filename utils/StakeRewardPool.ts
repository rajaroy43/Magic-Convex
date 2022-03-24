import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumberish, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import {  MgMagicToken, RewardPool } from '../typechain'
import { ARBITRUM_BLOCK_GAS_LIMIT } from './constants'

/**
 *
 * @param token => expects to have signer connected
 * @param guild => expects to have signer connected
 * @param amount
 */
export async function stakeMgMagic(
  wallet: SignerWithAddress | Wallet,
  token: MgMagicToken,
  rewardPool: RewardPool,
  amount: BigNumberish,
  alreadyApproved = false
) {
  if (typeof amount === 'number') amount = parseEther(`${amount}`)

  if (!alreadyApproved) await token.connect(wallet).approve(rewardPool.address, amount)
  return await rewardPool.connect(wallet).stake(amount, { gasLimit: ARBITRUM_BLOCK_GAS_LIMIT })
}
