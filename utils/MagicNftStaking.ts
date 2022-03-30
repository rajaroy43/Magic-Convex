import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, Wallet } from "ethers";
import { BytesLike } from "ethers/lib/utils";
import { IERC1155, IERC721, MagicNftStaking, MagicDepositor, Treasure, Legion } from "../typechain";

/**
 *
 * @param legion => expects to have signer connected
 * @param staking => expects to have signer connected
 * @param tokenId
 */
export async function stakeLegion(
  wallet: SignerWithAddress | Wallet,
  legion: IERC721 | Legion,
  staking: MagicNftStaking | MagicDepositor,
  tokenId: number,
  alreadyApproved = false
) {
  if (!alreadyApproved) await legion.connect(wallet).approve(staking.address, tokenId);
  await legion.connect(wallet).transferFrom(wallet.address, staking.address, tokenId);
  return await staking.connect(wallet).stakeLegion(tokenId);
}

/**
 *
 * @param legion => expects to have signer connected
 * @param staking => expects to have signer connected
 * @param tokenId
 */

export async function unStakeLegion(
  wallet: SignerWithAddress | Wallet,
  legion: IERC721 | Legion,
  staking: MagicNftStaking | MagicDepositor,
  tokenId: number
) {
  return await staking.connect(wallet).unStakeLegion(tokenId);
}

/**
 *
 * @param treasure => expects to have signer connected
 * @param staking => expects to have signer connected
 * @param tokenId
 * @param amount
 */
export async function stakeTreasures(
  wallet: SignerWithAddress | Wallet,
  treasure: IERC1155 | Treasure,
  staking: MagicNftStaking | MagicDepositor,
  tokenId: number,
  amount: BigNumberish,
  data: BytesLike,
  alreadyApproved = false
) {
  if (!alreadyApproved) await treasure.connect(wallet).setApprovalForAll(staking.address, true);
  await treasure
    .connect(wallet)
    .safeTransferFrom(wallet.address, staking.address, tokenId, amount, data);
  return await staking.connect(wallet).stakeTreasure(tokenId, amount);
}

/**
 *
 * @param treasure => expects to have signer connected
 * @param staking => expects to have signer connected
 * @param tokenId
 */

export async function unStakeTreasures(
  wallet: SignerWithAddress | Wallet,
  treasure: IERC1155 | Treasure,
  staking: MagicNftStaking | MagicDepositor,
  tokenId: number,
  amount: BigNumberish
) {
  return await staking.connect(wallet).unStakeTreasure(tokenId, amount);
}
