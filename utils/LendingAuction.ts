import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, Wallet } from "ethers";
import { BytesLike } from "ethers/lib/utils";
import { IERC1155, IERC721, Treasure, Legion, LendingAuctionNft } from "../typechain";

/**
 *
 * @param legion => expects to have signer connected
 * @param legion => expects to have signer connected
 * @param tokenId
 */
export async function depositLegion(
  wallet: SignerWithAddress | Wallet,
  legion: IERC721 | Legion,
  lendingAuction: LendingAuctionNft,
  tokenId: number,
  alreadyApproved = false
) {
  if (!alreadyApproved) await legion.connect(wallet).approve(lendingAuction.address, tokenId);
  return await lendingAuction.connect(wallet).depositLegion(tokenId);
}

/**
 *
 * @param legion => expects to have signer connected
 * @param lendingAuction => expects to have signer connected
 * @param tokenId
 */

export async function withdrawLegion(
  wallet: SignerWithAddress | Wallet,
  legion: IERC721 | Legion,
  lendingAuction: LendingAuctionNft,
  tokenId: number
) {
  return await lendingAuction.connect(wallet).withdrawLegion(tokenId);
}

/**
 *
 * @param treasure => expects to have signer connected
 * @param lendingAuction => expects to have signer connected
 * @param tokenId
 * @param amount
 */
export async function depositTreasures(
  wallet: SignerWithAddress | Wallet,
  treasure: IERC1155 | Treasure,
  lendingAuction: LendingAuctionNft,
  tokenId: number,
  amount: BigNumberish,
  alreadyApproved = false
) {
  if (!alreadyApproved)
    await treasure.connect(wallet).setApprovalForAll(lendingAuction.address, true);
  return await lendingAuction.connect(wallet).depositTreasures(tokenId, amount);
}

/**
 *
 * @param treasure => expects to have signer connected
 * @param staking => expects to have signer connected
 * @param tokenId
 */

export async function withdrawTreasures(
  wallet: SignerWithAddress | Wallet,
  treasure: IERC1155 | Treasure,
  lendingAuction: LendingAuctionNft,
  tokenId: number,
  amount: BigNumberish
) {
  return await lendingAuction.connect(wallet).withdrawTreasure(tokenId, amount);
}
