import { expect } from "chai";
import { BaseFixture } from "./fixtures/BaseFixture";
import { ethers } from "ethers";
import {
  ATLAS_MINE_ADDRESS,
  TREASURE_NFT_ADDRESS,
  LEGION_NFT_ADDRESS,
  LEGION_TOKEN_IDS,
  TREASURE_TOKEN_IDS,
} from "../utils/constants";
import { it } from "mocha";
import {
  depositLegion,
  depositTreasures,
  withdrawLegion,
  withdrawTreasures,
} from "../utils/LendingAuction";
import { deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IERC721, LendingAuctionNft } from "../typechain";
describe("Lending Auction NFT ", () => {
  const legionMainPool = 1; //None=0;legionMainPool=1;legionReservepool=2
  const legionResrevePool = 2;
  const TreasureMainPool = 3;
  const TreasureReservePool = 4;
  const AddressZero = ethers.constants.AddressZero;
  it("LendingAuctionNFT  Intialization", async () => {
    const {
      magicDepositor: { address: magicDepositorAddress },
      lendingAuctionNft,
    } = await BaseFixture();
    const treasure = await lendingAuctionNft.treasure();
    const legion = await lendingAuctionNft.legion();
    const atlasMine = await lendingAuctionNft.atlasmine();
    const magicDepositor = await lendingAuctionNft.magicDepositor();
    const legionMainPoolLength = (await lendingAuctionNft.legionPoolTokenIds(legionMainPool))
      .length;
    const treasureInMainPool = await lendingAuctionNft.treasureInPool(TreasureMainPool);
    expect(treasure).to.equal(TREASURE_NFT_ADDRESS);
    expect(legion).to.equal(LEGION_NFT_ADDRESS);
    expect(atlasMine).to.equal(ATLAS_MINE_ADDRESS);
    expect(magicDepositor).to.equal(magicDepositorAddress);
    expect(legionMainPoolLength).to.equal(0);
    expect(treasureInMainPool).to.equal(0);
  });

  describe("Depositing/Withdrawing Legion", () => {
    describe("Depositing Legion", () => {
      it("Should Revert When  Depositing Legion without approving", async () => {
        const { lendingAuctionNft } = await BaseFixture();
        const legionTokendId = LEGION_TOKEN_IDS[0];
        await expect(lendingAuctionNft.depositLegion(legionTokendId)).to.be.revertedWith(
          "ERC721: transfer caller is not owner nor approved"
        );
      });

      it("Should deposit Legion 3 time in mainPool", async () => {
        const { lendingAuctionNft, alice, legion, atlasMine } = await BaseFixture();
        const legionTokendId_1 = LEGION_TOKEN_IDS[0];

        const mainLegionPoolValues = await lendingAuctionNft.legionPoolTokenIds(legionMainPool);
        const beforeDepositUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const beforeDepositLegionMainPoolUserBoosts = beforeDepositUserBoosts[0];
        const beforeDepositLegionReservePoolUserBoosts = beforeDepositUserBoosts[1];

        expect(mainLegionPoolValues).to.be.empty;
        expect(beforeDepositLegionMainPoolUserBoosts).to.be.empty;
        expect(beforeDepositLegionReservePoolUserBoosts).to.be.empty;

        const beforeDepositUserBoost = await lendingAuctionNft.getUserLegionData(
          alice.address,
          legionTokendId_1
        );

        expect(beforeDepositUserBoost.user).to.equal(AddressZero);

        await expect(depositLegion(alice, legion, lendingAuctionNft, legionTokendId_1)).to.emit(
          lendingAuctionNft,
          "Deposit"
        );

        const afterDepositUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterDepositLegionMainPoolUserBoosts = afterDepositUserBoosts[0];
        const afterDepositLegionReservePoolUserBoosts = afterDepositUserBoosts[1];
        expect(afterDepositLegionMainPoolUserBoosts.length).to.equal(1);
        expect(afterDepositLegionReservePoolUserBoosts).to.be.empty;

        const afterDepositUserBoost = await lendingAuctionNft.getUserLegionData(
          alice.address,
          legionTokendId_1
        );
        const getBoostId1 = await atlasMine.getNftBoost(legion.address, legionTokendId_1, 1);

        const afterDepositinglegionMainPoolTokenIds_1 = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        expect(afterDepositUserBoost.user).to.equal(alice.address);
        expect(afterDepositUserBoost.amount).to.equal(1);

        expect(afterDepositUserBoost.boost).to.equal(getBoostId1);
        expect(afterDepositinglegionMainPoolTokenIds_1).to.eql([legionTokendId_1]);

        const legionTokendId_2 = LEGION_TOKEN_IDS[1];

        await expect(depositLegion(alice, legion, lendingAuctionNft, legionTokendId_2)).to.emit(
          lendingAuctionNft,
          "Deposit"
        );

        const afterDepositinglegionMainPoolTokenIds_2 = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        expect(afterDepositinglegionMainPoolTokenIds_2).to.eql([
          legionTokendId_1,
          legionTokendId_2,
        ]);

        const legionTokendId_3 = LEGION_TOKEN_IDS[2];

        await expect(depositLegion(alice, legion, lendingAuctionNft, legionTokendId_3)).to.emit(
          lendingAuctionNft,
          "Deposit"
        );

        const afterDepositinglegionMainPoolTokenIds_3 = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        expect(afterDepositinglegionMainPoolTokenIds_3).to.eql([
          legionTokendId_1,
          legionTokendId_2,
          legionTokendId_3,
        ]);
      });

      it("Should deposit Legion multiple time in mainPool/reservePool", async () => {
        const { lendingAuctionNft, alice, legion, atlasMine } = await BaseFixture();
        const legionTokendId_5 = LEGION_TOKEN_IDS[4];

        for (let i = 0; i < 4; i++) {
          await depositLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[i]);
        }
        const beforeDepositUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const beforeDepositLegionMainPoolUserBoosts = beforeDepositUserBoosts[0];
        const beforeDepositLegionReservePoolUserBoosts = beforeDepositUserBoosts[1];

        for (let i = 0; i < beforeDepositLegionMainPoolUserBoosts.length; i++) {
          const expectedBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_IDS[i], 1);
          const amount = beforeDepositLegionMainPoolUserBoosts[i].amount;
          const boost = beforeDepositLegionMainPoolUserBoosts[i].boost;
          const tokenId = beforeDepositLegionMainPoolUserBoosts[i].tokenId;
          const user = beforeDepositLegionMainPoolUserBoosts[i].user;
          expect(amount).to.equal(1);
          expect(boost).to.equal(expectedBoost);
          expect(tokenId).to.equal(LEGION_TOKEN_IDS[i]);
          expect(user).to.equal(alice.address);
        }
        expect(beforeDepositLegionReservePoolUserBoosts.length).to.equal(1);
        expect(beforeDepositLegionReservePoolUserBoosts[0].amount).to.equal(1);
        expect(beforeDepositLegionReservePoolUserBoosts[0].tokenId).to.equal(LEGION_TOKEN_IDS[3]);

        const beforeDepositingLegionMainPoolTokenIds_4 = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());

        expect(beforeDepositingLegionMainPoolTokenIds_4.length).to.equal(3);

        const beforeDepositingLegionReservePoolTokenIds_4 = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(beforeDepositingLegionMainPoolTokenIds_4).to.eql([
          LEGION_TOKEN_IDS[0],
          LEGION_TOKEN_IDS[1],
          LEGION_TOKEN_IDS[2],
        ]);
        expect(beforeDepositingLegionReservePoolTokenIds_4).to.eql([LEGION_TOKEN_IDS[3]]);

        //LegionTokenIds[2] will replaced by  LegionTokenIds[4]
        //Because LegionTokenIds[4] is more rare than all preserve legion in mainPool
        await expect(depositLegion(alice, legion, lendingAuctionNft, legionTokendId_5)).to.emit(
          lendingAuctionNft,
          "Deposit"
        );

        const tokenId_3Owner = await legion.ownerOf(LEGION_TOKEN_IDS[2]);
        expect(tokenId_3Owner).to.equal(lendingAuctionNft.address);

        const tokenId_4Owner = await legion.ownerOf(LEGION_TOKEN_IDS[4]);
        expect(tokenId_4Owner).to.equal(atlasMine.address);

        const afterDepositUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterDepositLegionMainPoolUserBoosts = afterDepositUserBoosts[0];
        const afterDepositLegionReservePoolUserBoosts = afterDepositUserBoosts[1];

        // runUpto i=2 ,because 3rd id is interchange wih recently deposited legion
        for (let i = 0; i < afterDepositLegionMainPoolUserBoosts.length - 1; i++) {
          const expectedBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_IDS[i], 1);
          const amount = beforeDepositLegionMainPoolUserBoosts[i].amount;
          const boost = beforeDepositLegionMainPoolUserBoosts[i].boost;
          const tokenId = beforeDepositLegionMainPoolUserBoosts[i].tokenId;
          const user = beforeDepositLegionMainPoolUserBoosts[i].user;
          expect(amount).to.equal(1);
          expect(boost).to.equal(expectedBoost);
          expect(tokenId).to.equal(LEGION_TOKEN_IDS[i]);
          expect(user).to.equal(alice.address);
        }

        const replacedUser = afterDepositLegionMainPoolUserBoosts[2];
        const expectedBoost = await atlasMine.getNftBoost(legion.address, LEGION_TOKEN_IDS[4], 1);
        expect(replacedUser.amount).to.equal(1);
        expect(replacedUser.boost).to.equal(expectedBoost);
        expect(replacedUser.tokenId).to.equal(LEGION_TOKEN_IDS[4]);
        expect(replacedUser.user).to.equal(alice.address);
        // ReservePool , now have userBoost with length 2 with data (id 2 previously)
        expect(afterDepositLegionReservePoolUserBoosts[1]).to.eql(
          beforeDepositLegionMainPoolUserBoosts[2]
        );

        const afterDepositingLegionMainPoolTokenIds_3 = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        expect(afterDepositingLegionMainPoolTokenIds_3).to.eql([
          LEGION_TOKEN_IDS[0],
          LEGION_TOKEN_IDS[1],
          LEGION_TOKEN_IDS[4],
        ]);

        const afterDepositingLegionReservePoolTokenIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());
        expect(afterDepositingLegionReservePoolTokenIds).to.eql([
          LEGION_TOKEN_IDS[3],
          LEGION_TOKEN_IDS[2],
        ]);
      });
    });

    describe("Withdrawing Legion", () => {
      it("Withdrawing legion without depositing", async () => {
        const tokenId = LEGION_TOKEN_IDS[0];
        const { lendingAuctionNft, alice, legion } = await BaseFixture();
        await expect(withdrawLegion(alice, legion, lendingAuctionNft, tokenId)).to.be.revertedWith(
          "No pool assoicated with token id"
        );
      });
      it("Successfully withdraw legion after deposit", async () => {
        const tokenId = LEGION_TOKEN_IDS[0];
        const { lendingAuctionNft, alice, legion, atlasMine } = await BaseFixture();
        expect(await legion.ownerOf(tokenId)).to.equal(alice.address);

        await expect(depositLegion(alice, legion, lendingAuctionNft, tokenId))
          .to.emit(lendingAuctionNft, "Deposit")
          .withArgs(legion.address, tokenId, 1);
        expect(await legion.ownerOf(tokenId)).to.equal(atlasMine.address);

        const beforeWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const beforeWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(beforeWithdrawMainLegionIds).to.eql([tokenId]);
        expect(beforeWithdrawReserveLegionIds).to.empty;

        await expect(withdrawLegion(alice, legion, lendingAuctionNft, tokenId))
          .to.emit(lendingAuctionNft, "Withdrawn")
          .withArgs(legion.address, tokenId, 1);

        expect(await legion.ownerOf(tokenId)).to.equal(alice.address);

        const afterWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const afterWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(afterWithdrawMainLegionIds).to.empty;
        expect(afterWithdrawReserveLegionIds).to.empty;

        await expect(withdrawLegion(alice, legion, lendingAuctionNft, tokenId)).to.be.revertedWith(
          "No pool assoicated with token id"
        );
      });

      const fixture = deployments.createFixture(async () => {
        const baseFixture = await BaseFixture();
        const { lendingAuctionNft, alice, legion } = baseFixture;
        for (let i = 0; i < LEGION_TOKEN_IDS.length; i++) {
          await depositLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[i]);
        }
        // MainPool => tokenId[0],tokenId[1],tokenId[4]
        // ReservePool => tokenId[3],tokenId[2]
        return { ...baseFixture };
      });

      it("Successfully withdraw 1st tokenId in reservPool legion after multiple deposit", async () => {
        const { lendingAuctionNft, alice, legion } = await fixture();

        const beforeWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const beforeWithdrawMainLegionUserBoosts = beforeWithdrawLegionUserBoosts[0];
        const beforeWithdrawReserveLegionUserBoosts = beforeWithdrawLegionUserBoosts[1];

        expect(beforeWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(beforeWithdrawReserveLegionUserBoosts.length).to.equal(2);

        // Now we have 3 tokenId in mainPool
        // And 2 tokenId are in reserve Pool

        // 1st withdrawing tokenIds that are in reservePool which are
        // LEGION_TOKEN_IDS[3] and LEGION_TOKEN_IDS[2]
        // Lets remove 1st tokenIds[3],no change in mainPool but
        // will be change in reservePool

        const beforeWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const beforeWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(beforeWithdrawMainLegionIds).to.eql([
          LEGION_TOKEN_IDS[0],
          LEGION_TOKEN_IDS[1],
          LEGION_TOKEN_IDS[4],
        ]);
        expect(beforeWithdrawReserveLegionIds).to.eql([LEGION_TOKEN_IDS[3], LEGION_TOKEN_IDS[2]]);

        const tokenId = LEGION_TOKEN_IDS[3];

        await expect(withdrawLegion(alice, legion, lendingAuctionNft, tokenId))
          .to.emit(lendingAuctionNft, "Withdrawn")
          .withArgs(legion.address, tokenId, 1);

        // MainPool => tokenId[0],tokenId[1],tokenId[4]
        // ReservePool => tokenId[2]

        const afterWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterWithdrawMainLegionUserBoosts = afterWithdrawLegionUserBoosts[0];
        const afterWithdrawReserveLegionUserBoosts = afterWithdrawLegionUserBoosts[1];

        const afterWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const afterWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(afterWithdrawMainLegionIds).to.eql([
          LEGION_TOKEN_IDS[0],
          LEGION_TOKEN_IDS[1],
          LEGION_TOKEN_IDS[4],
        ]);
        expect(afterWithdrawReserveLegionIds).to.eql([LEGION_TOKEN_IDS[2]]);

        expect(afterWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(afterWithdrawReserveLegionUserBoosts.length).to.equal(1);

        expect(afterWithdrawMainLegionUserBoosts).to.eql(beforeWithdrawMainLegionUserBoosts);
        expect(afterWithdrawReserveLegionUserBoosts[0]).to.eql(
          beforeWithdrawReserveLegionUserBoosts[1]
        );

        expect(await legion.ownerOf(tokenId)).to.equal(alice.address);
      });

      it("Successfully withdraw 1st mainPool legion after multiple deposit", async () => {
        const { lendingAuctionNft, alice, legion } = await fixture();
        const beforeWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const beforeWithdrawMainLegionUserBoosts = beforeWithdrawLegionUserBoosts[0];
        const beforeWithdrawReserveLegionUserBoosts = beforeWithdrawLegionUserBoosts[1];

        expect(beforeWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(beforeWithdrawReserveLegionUserBoosts.length).to.equal(2);

        // 1st withdrawing tokenIds that are in mainPool which are
        // LEGION_TOKEN_IDS[0] and LEGION_TOKEN_IDS[1] and LEGION_TOKEN_IDS[4]
        // Lets remove 1st tokenIds[0],will be  change in mainPool and as well as  in reservePool

        const tokenId = LEGION_TOKEN_IDS[0];

        await expect(withdrawLegion(alice, legion, lendingAuctionNft, tokenId))
          .to.emit(lendingAuctionNft, "Withdrawn")
          .withArgs(legion.address, tokenId, 1);

        // removed tokendId1 from mainPool and reservePool higherBoost with more time deposit will be replaced
        // MainPool => tokenId[4],tokenId[1],tokenId[2]
        // ReservePool => tokenId[3]

        // Both tokendId2 and tokendId3 have same boost : 5000000000000(0.05)
        // but tokenID2 have higher time than tokenId3 , so tokenId2 will in mainPool

        const afterWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterWithdrawMainLegionUserBoosts = afterWithdrawLegionUserBoosts[0];
        const afterWithdrawReserveLegionUserBoosts = afterWithdrawLegionUserBoosts[1];

        const afterWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const afterWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(afterWithdrawMainLegionIds).to.eql([
          LEGION_TOKEN_IDS[4],
          LEGION_TOKEN_IDS[1],
          LEGION_TOKEN_IDS[2],
        ]);
        expect(afterWithdrawReserveLegionIds).to.eql([LEGION_TOKEN_IDS[3]]);

        expect(afterWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(afterWithdrawReserveLegionUserBoosts.length).to.equal(1);

        const expectedMainLegionBoost: LendingAuctionNft.UserBoostStructOutput[] = [
          beforeWithdrawMainLegionUserBoosts[2],
          beforeWithdrawMainLegionUserBoosts[1],
          beforeWithdrawReserveLegionUserBoosts[1],
        ];
        expect(afterWithdrawMainLegionUserBoosts).to.eql(expectedMainLegionBoost);
        expect(afterWithdrawReserveLegionUserBoosts[0]).to.eql(
          beforeWithdrawReserveLegionUserBoosts[0]
        );

        expect(await legion.ownerOf(tokenId)).to.equal(alice.address);
      });

      it("Successfully withdraw all  mainPool legion after multiple deposit", async () => {
        const { lendingAuctionNft, alice, legion } = await fixture();
        const beforeWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const beforeWithdrawMainLegionUserBoosts = beforeWithdrawLegionUserBoosts[0];
        const beforeWithdrawReserveLegionUserBoosts = beforeWithdrawLegionUserBoosts[1];

        const beforeWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const beforeWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(beforeWithdrawMainLegionIds).to.eql([
          LEGION_TOKEN_IDS[0],
          LEGION_TOKEN_IDS[1],
          LEGION_TOKEN_IDS[4],
        ]);
        expect(beforeWithdrawReserveLegionIds).to.eql([LEGION_TOKEN_IDS[3], LEGION_TOKEN_IDS[2]]);

        expect(beforeWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(beforeWithdrawReserveLegionUserBoosts.length).to.equal(2);

        await withdrawLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[0]);
        await withdrawLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[1]);
        await withdrawLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[4]);
        // removed tokendId1 from mainPool and reservePool higherBoost with more time deposit will be replaced
        // MainPool => tokenId[2],tokenId[3]
        // ReservePool => []

        // Both tokendId2 and tokendId3 have same boost : 5000000000000(0.05)
        // but tokenID2 have higher time than tokenId3 , so tokenId2 will in mainPool

        const afterWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterWithdrawMainLegionUserBoosts = afterWithdrawLegionUserBoosts[0];
        const afterWithdrawReserveLegionUserBoosts = afterWithdrawLegionUserBoosts[1];

        const afterWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const afterWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(afterWithdrawMainLegionIds).to.eql([LEGION_TOKEN_IDS[3], LEGION_TOKEN_IDS[2]]);
        expect(afterWithdrawReserveLegionIds).to.empty;

        expect(afterWithdrawMainLegionUserBoosts.length).to.equal(2);
        expect(afterWithdrawReserveLegionUserBoosts.length).to.equal(0);

        expect(afterWithdrawMainLegionUserBoosts).to.eql(beforeWithdrawReserveLegionUserBoosts);
        expect(afterWithdrawReserveLegionUserBoosts).to.empty;

        expect(await legion.ownerOf(LEGION_TOKEN_IDS[0])).to.equal(alice.address);
        expect(await legion.ownerOf(LEGION_TOKEN_IDS[1])).to.equal(alice.address);
        expect(await legion.ownerOf(LEGION_TOKEN_IDS[4])).to.equal(alice.address);
      });
      it("Successfully withdraw all  reserve legion after multiple deposit", async () => {
        const { lendingAuctionNft, alice, legion } = await fixture();
        const beforeWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const beforeWithdrawMainLegionUserBoosts = beforeWithdrawLegionUserBoosts[0];
        const beforeWithdrawReserveLegionUserBoosts = beforeWithdrawLegionUserBoosts[1];
        const beforeWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const beforeWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(beforeWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(beforeWithdrawReserveLegionUserBoosts.length).to.equal(2);

        await withdrawLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[2]);
        await withdrawLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[3]);

        // MainPool => as it as earlier
        // ReservePool => []

        const afterWithdrawLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterWithdrawMainLegionUserBoosts = afterWithdrawLegionUserBoosts[0];
        const afterWithdrawReserveLegionUserBoosts = afterWithdrawLegionUserBoosts[1];

        const afterWithdrawMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const afterWithdrawReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(afterWithdrawMainLegionIds).to.eql(beforeWithdrawMainLegionIds);
        expect(afterWithdrawReserveLegionIds).to.empty;

        expect(afterWithdrawMainLegionUserBoosts.length).to.equal(3);
        expect(afterWithdrawReserveLegionUserBoosts.length).to.equal(0);

        expect(afterWithdrawMainLegionUserBoosts).to.eql(beforeWithdrawMainLegionUserBoosts);
        expect(afterWithdrawReserveLegionUserBoosts).to.empty;

        expect(await legion.ownerOf(LEGION_TOKEN_IDS[2])).to.equal(alice.address);
        expect(await legion.ownerOf(LEGION_TOKEN_IDS[3])).to.equal(alice.address);

        // Now withdrawing tokenId[4]

        await withdrawLegion(alice, legion, lendingAuctionNft, LEGION_TOKEN_IDS[4]);

        const afterWithdrawAgainLegionUserBoosts = await lendingAuctionNft.getLegionUserBoosts();
        const afterWithdrawAgainMainLegionUserBoosts = afterWithdrawAgainLegionUserBoosts[0];
        const afterWithdrawAgainReserveLegionUserBoosts = afterWithdrawAgainLegionUserBoosts[1];

        const afterWithdrawAgainMainLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionMainPool)
        ).map((id) => id.toNumber());
        const afterWithdrawAgainReserveLegionIds = (
          await lendingAuctionNft.legionPoolTokenIds(legionResrevePool)
        ).map((id) => id.toNumber());

        expect(afterWithdrawAgainMainLegionIds).to.eql(
          beforeWithdrawMainLegionIds.slice(0, beforeWithdrawMainLegionIds.length - 1)
        );

        expect(afterWithdrawAgainReserveLegionIds).to.empty;

        expect(afterWithdrawAgainMainLegionUserBoosts.length).to.equal(2);
        expect(afterWithdrawAgainReserveLegionUserBoosts.length).to.equal(0);

        expect(afterWithdrawAgainMainLegionUserBoosts).to.eql(
          beforeWithdrawMainLegionUserBoosts.slice(0, beforeWithdrawMainLegionUserBoosts.length - 1)
        );
        expect(afterWithdrawAgainReserveLegionUserBoosts).to.empty;

        expect(await legion.ownerOf(LEGION_TOKEN_IDS[4])).to.equal(alice.address);
      });
    });
  });

  describe("Depositing/Withdrawing Treasures", () => {
    describe("Depositing Treasures", () => {
      it("Should not Deposit 0 Treasures ", async () => {
        const amount = 0;
        const { lendingAuctionNft } = await BaseFixture();
        const treasureTokendId = TREASURE_TOKEN_IDS[0];
        await expect(
          lendingAuctionNft.depositTreasures(treasureTokendId, amount)
        ).to.be.revertedWith("Amount is 0");
      });

      it("Should Revert When  Depositing Treasures without approving", async () => {
        const amount = 1;
        const { lendingAuctionNft } = await BaseFixture();
        const treasureTokendId = TREASURE_TOKEN_IDS[0];
        await expect(
          lendingAuctionNft.depositTreasures(treasureTokendId, amount)
        ).to.be.revertedWith("ERC1155: caller is not owner nor approved");
      });

      it("Should deposit Treasure by 30 amounts  in mainPool/reservePool", async () => {
        const { lendingAuctionNft, alice, treasure, atlasMine } = await BaseFixture();
        const treasureTokendId_1 = TREASURE_TOKEN_IDS[0];
        const amount = 10;

        const mainPoolTreasureDeposits = await lendingAuctionNft.treasureInPool(TreasureMainPool);
        const reservePoolTreasureDeposits = await lendingAuctionNft.treasureInPool(
          TreasureReservePool
        );
        const beforeDepositUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const beforeDepositTreasureMainPoolUserBoosts = beforeDepositUserBoosts[0];
        const beforeDepositTreasureReservePoolUserBoosts = beforeDepositUserBoosts[1];

        expect(mainPoolTreasureDeposits).to.equal(0);
        expect(reservePoolTreasureDeposits).to.equal(0);
        expect(beforeDepositTreasureMainPoolUserBoosts).to.be.empty;
        expect(beforeDepositTreasureReservePoolUserBoosts).to.be.empty;

        const beforeDepositUserBoost = await lendingAuctionNft.getUserTreasureData(
          TreasureMainPool,
          0 //unknown index
        );

        expect(beforeDepositUserBoost.amount).to.equal(0);
        expect(beforeDepositUserBoost.tokenId).to.equal(0);
        expect(beforeDepositUserBoost.user).to.equal(AddressZero);

        await expect(
          depositTreasures(alice, treasure, lendingAuctionNft, treasureTokendId_1, amount)
        )
          .to.emit(lendingAuctionNft, "Deposit")
          .withArgs(treasure.address, treasureTokendId_1, amount);

        const afterDepositUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const afterDepositTreasureMainPoolUserBoosts = afterDepositUserBoosts[0];
        const afterDepositTreasureReservePoolUserBoosts = afterDepositUserBoosts[1];
        expect(afterDepositTreasureMainPoolUserBoosts.length).to.equal(1);
        expect(afterDepositTreasureReservePoolUserBoosts).to.be.empty;

        const userTreasureBoostIds = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokendId_1,
          amount
        );
        const userMainTreasureBoostIds = userTreasureBoostIds[0];
        const userReserveTreasureBoostIds = userTreasureBoostIds[1];

        const treasureInMainPool = (
          await lendingAuctionNft.treasureInPool(TreasureMainPool)
        ).toNumber();
        const treasureInReservePool = (
          await lendingAuctionNft.treasureInPool(TreasureReservePool)
        ).toNumber();
        expect(treasureInMainPool).to.equal(amount);
        expect(treasureInReservePool).to.equal(0);
        expect(userMainTreasureBoostIds.length).to.equal(1);
        expect(userReserveTreasureBoostIds).to.be.empty;
        const afterDepositUserBoost = await lendingAuctionNft.getUserTreasureData(
          TreasureMainPool,
          userMainTreasureBoostIds[0]
        );
        const getBoostId1 = await atlasMine.getNftBoost(
          treasure.address,
          treasureTokendId_1,
          amount
        );

        expect(afterDepositUserBoost.user).to.equal(alice.address);
        expect(afterDepositUserBoost.amount).to.equal(amount);
        expect(afterDepositUserBoost.tokenId).to.equal(treasureTokendId_1);
        expect(afterDepositUserBoost.boost).to.equal(getBoostId1);

        const treasureTokendId_2 = TREASURE_TOKEN_IDS[1];

        await expect(
          depositTreasures(alice, treasure, lendingAuctionNft, treasureTokendId_2, amount)
        ).to.emit(lendingAuctionNft, "Deposit");

        const afterDepositUserBoostsId_2 = await lendingAuctionNft.getTreasureUserBoosts();
        const afterDepositTreasureMainPoolUserBoosts_2 = afterDepositUserBoostsId_2[0];
        const afterDepositTreasureReservePoolUserBoosts_2 = afterDepositUserBoostsId_2[1];
        expect(afterDepositTreasureMainPoolUserBoosts_2.length).to.equal(2);
        expect(afterDepositTreasureReservePoolUserBoosts_2).to.be.empty;

        const userTreasureBoostIds_2 = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokendId_2,
          amount
        );
        const userMainTreasureBoostIds_2 = userTreasureBoostIds_2[0];
        const userReserveTreasureBoostIds_2 = userTreasureBoostIds_2[1];
        expect(userTreasureBoostIds_2.length).to.equal(2);
        expect(userReserveTreasureBoostIds_2).to.be.empty;
        const afterDepositUserBoost_2 = await lendingAuctionNft.getUserTreasureData(
          TreasureMainPool,
          userMainTreasureBoostIds_2[0]
        );
        const getBoostId_2 = await atlasMine.getNftBoost(
          treasure.address,
          treasureTokendId_2,
          amount
        );

        expect(afterDepositUserBoost_2.user).to.equal(alice.address);
        expect(afterDepositUserBoost_2.amount).to.equal(amount);
        expect(afterDepositUserBoost_2.tokenId).to.equal(treasureTokendId_2);
        expect(afterDepositUserBoost_2.boost).to.equal(getBoostId_2);

        //tokenid[0] and tokenid[1] =>mainTreasurePool
        const treasureTokendId_3 = TREASURE_TOKEN_IDS[2];

        await expect(
          depositTreasures(alice, treasure, lendingAuctionNft, treasureTokendId_3, amount)
        ).to.emit(lendingAuctionNft, "Deposit");

        //tokenid[1] and tokenid[2] =>mainTreasurePool
        //tokenid[0] =>reserveTreasurePool

        const afterDepositUserBoostsId_3 = await lendingAuctionNft.getTreasureUserBoosts();
        const afterDepositTreasureMainPoolUserBoosts_3 = afterDepositUserBoostsId_3[0];
        const afterDepositTreasureReservePoolUserBoosts_3 = afterDepositUserBoostsId_3[1];

        const expectedMainPoolTreasuresBoost: LendingAuctionNft.UserBoostStruct[] = [
          afterDepositTreasureMainPoolUserBoosts_2[1],
          afterDepositTreasureMainPoolUserBoosts_3[1],
        ];
        const expectedReservePoolTreasuresBoost: LendingAuctionNft.UserBoostStruct[] = [
          afterDepositTreasureMainPoolUserBoosts_2[0],
        ];
        expect(afterDepositTreasureMainPoolUserBoosts_3).to.eql(expectedMainPoolTreasuresBoost);
        expect(afterDepositTreasureReservePoolUserBoosts_3).to.eql(
          expectedReservePoolTreasuresBoost
        );
        expect(afterDepositTreasureMainPoolUserBoosts_3.length).to.equal(2);
        expect(afterDepositTreasureReservePoolUserBoosts_3.length).to.equal(1);

        const userTreasureBoostIds_3 = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokendId_3,
          amount
        );

        const userMainTreasureBoostIds_3 = userTreasureBoostIds_3[0];
        const userReserveTreasureBoostIds_3 = userTreasureBoostIds_3[1];

        expect(userReserveTreasureBoostIds_3).to.empty;
        // TreasureMainPool at index 1, with treasureId3
        expect(userMainTreasureBoostIds_3[0]).to.equal(1);

        const afterDepositUserBoost_3 = await lendingAuctionNft.getUserTreasureData(
          TreasureMainPool,
          userMainTreasureBoostIds_3[0]
        );
        const getBoostId_3 = await atlasMine.getNftBoost(
          treasure.address,
          treasureTokendId_3,
          amount
        );

        expect(afterDepositUserBoost_3.user).to.equal(alice.address);
        expect(afterDepositUserBoost_3.amount).to.equal(amount);
        expect(afterDepositUserBoost_3.tokenId).to.equal(treasureTokendId_3);
        expect(afterDepositUserBoost_3.boost).to.equal(getBoostId_3);

        // Final TreasureBalance
        const args = [
          [alice.address, alice.address, alice.address],
          [treasureTokendId_1, treasureTokendId_2, treasureTokendId_3],
        ];
        // @ts-ignore
        const finalTreasureBalances = await treasure.balanceOfBatch(...args);

        // 15 treasure minted when deploying treasure to alice,bob,carol
        const leftBalance = 15 - amount;
        finalTreasureBalances.map((balance) => {
          expect(balance).to.equal(leftBalance);
        });
      });

      it("Should deposit Treasure in many parts in mainPool", async () => {
        const { lendingAuctionNft, alice, bob, treasure, atlasMine, magicDepositor } =
          await BaseFixture();

        const treasureTokendId_1 = TREASURE_TOKEN_IDS[0];
        const amount = 15;

        const beforeFirstDepositTreasureUserBoost = await lendingAuctionNft.getTreasureUserBoosts();
        const beforeFirstDepositMainPoolUserBoost = beforeFirstDepositTreasureUserBoost[0];
        const beforeFirstDepositReservePoolUserBoost = beforeFirstDepositTreasureUserBoost[1];

        expect(beforeFirstDepositMainPoolUserBoost).to.be.empty;
        expect(beforeFirstDepositReservePoolUserBoost).to.be.empty;
        // 1st depositing treasure with  amount as 15 with tokenId_0

        await expect(
          depositTreasures(alice, treasure, lendingAuctionNft, treasureTokendId_1, amount)
        )
          .to.emit(lendingAuctionNft, "Deposit")
          .withArgs(treasure.address, treasureTokendId_1, amount);

        const afterFirstDepositTreasureUserBoost = await lendingAuctionNft.getTreasureUserBoosts();
        const afterFirstDepositMainPoolUserBoost = afterFirstDepositTreasureUserBoost[0];
        const afterFirstDepositReservePoolUserBoost = afterFirstDepositTreasureUserBoost[1];

        expect(afterFirstDepositMainPoolUserBoost.length).to.equal(1);
        expect(afterFirstDepositReservePoolUserBoost).to.be.empty;

        expect(afterFirstDepositMainPoolUserBoost[0].user).equal(alice.address);
        expect(afterFirstDepositMainPoolUserBoost[0].amount).equal(amount);
        expect(afterFirstDepositMainPoolUserBoost[0].tokenId).equal(treasureTokendId_1);

        // Now only 5 treasure will be deposits to mainPool , remaining 10 will be deposit to reservePool

        const bobBeforeDeposit = await treasure.balanceOf(bob.address, treasureTokendId_1);

        await expect(depositTreasures(bob, treasure, lendingAuctionNft, treasureTokendId_1, amount))
          .to.emit(lendingAuctionNft, "Deposit")
          .withArgs(treasure.address, treasureTokendId_1, amount);
        const bobAfterDeposit = await treasure.balanceOf(bob.address, treasureTokendId_1);
        expect(bobAfterDeposit).to.equal(bobBeforeDeposit.sub(amount));

        const afterSecondDepositTreasureUserBoost = await lendingAuctionNft.getTreasureUserBoosts();
        const afterSecondDepositMainPoolUserBoost = afterSecondDepositTreasureUserBoost[0];
        const afterSecondDepositReservePoolUserBoost = afterSecondDepositTreasureUserBoost[1];

        const getUserBoostIds = await lendingAuctionNft.getUserIndexTreasureBoosts(
          bob.address,
          treasureTokendId_1,
          amount - 10
        );
        const userMainTreasureBoostIds_3 = getUserBoostIds[0];
        const userReserveTreasureBoostIds_3 = getUserBoostIds[1];
        expect(userMainTreasureBoostIds_3.length).to.equal(1);
        const getUserBoostDataInMainPool = await lendingAuctionNft.getUserTreasureData(
          TreasureMainPool,
          userMainTreasureBoostIds_3[0]
        );
        const expectedTreasureMainPoolUserBoost: LendingAuctionNft.UserBoostStruct[] = [
          afterFirstDepositMainPoolUserBoost[0],
          getUserBoostDataInMainPool,
        ];

        const getUserBoostIdsAfterMainDepositing =
          await lendingAuctionNft.getUserIndexTreasureBoosts(
            bob.address,
            treasureTokendId_1,
            amount - 5
          );
        const getUserBoostIdsInReservePool = getUserBoostIdsAfterMainDepositing[1];
        expect(getUserBoostIdsInReservePool.length).to.equal(1);
        const getUserBoostDataInReservePool = await lendingAuctionNft.getUserTreasureData(
          TreasureReservePool,
          getUserBoostIdsInReservePool[0]
        );
        const expectedTreasureReservePoolUserBoost: LendingAuctionNft.UserBoostStruct[] = [
          getUserBoostDataInReservePool,
        ];
        expect(afterSecondDepositMainPoolUserBoost.length).to.equal(2);
        expect(afterSecondDepositReservePoolUserBoost.length).to.equal(1);

        expect(afterSecondDepositMainPoolUserBoost).to.eql(expectedTreasureMainPoolUserBoost);
        expect(afterSecondDepositReservePoolUserBoost).to.eql(expectedTreasureReservePoolUserBoost);

        // Final Boost

        const finalBoost = await atlasMine.getUserBoost(magicDepositor.address);
        const expectedBoost = afterSecondDepositMainPoolUserBoost[0].boost.add(
          afterSecondDepositMainPoolUserBoost[1].boost
        );

        expect(finalBoost).to.equal(expectedBoost);
      });
    });
    describe("Withdrawing Treasures", () => {
      const fixture = deployments.createFixture(async () => {
        const baseFixture = await BaseFixture();
        const { lendingAuctionNft, alice, treasure } = baseFixture;
        const amount = 10;
        for (let i = 0; i < 3; i++) {
          await depositTreasures(alice, treasure, lendingAuctionNft, TREASURE_TOKEN_IDS[i], amount);
        }
        // MainPool => tokenId[1],tokenId[2]
        // ReservePool => tokenId[0]
        return { ...baseFixture };
      });

      it("Should not withdraw 0 Treasures ", async () => {
        const amount = 0;
        const { lendingAuctionNft, alice, treasure } = await BaseFixture();
        const treasureTokendId = TREASURE_TOKEN_IDS[0];
        await expect(
          withdrawTreasures(alice, treasure, lendingAuctionNft, treasureTokendId, amount)
        ).to.be.revertedWith("Amount is 0");
      });

      it("Should not withdraw Treasures without depositing", async () => {
        const amount = 1;
        const { lendingAuctionNft, alice, treasure } = await BaseFixture();
        const treasureTokendId = TREASURE_TOKEN_IDS[0];
        await expect(
          withdrawTreasures(alice, treasure, lendingAuctionNft, treasureTokendId, amount)
        ).to.be.revertedWith("User don't have enough  treasures");
      });

      it("Should not  withdraw half Treasures ,only withdraw exact deposit amount ", async () => {
        const amount = 15;
        const { lendingAuctionNft, alice, bob, treasure } = await BaseFixture();
        const treasureTokendId = TREASURE_TOKEN_IDS[0];
        await depositTreasures(alice, treasure, lendingAuctionNft, treasureTokendId, amount);
        // Withdrawing 8 treasures

        const withdrawnAmount = 8;
        await expect(
          withdrawTreasures(alice, treasure, lendingAuctionNft, treasureTokendId, withdrawnAmount)
        ).to.be.revertedWith("Provide Exact amount");
      });

      it("Should  withdraw  Treasures", async () => {
        const amount = 15;
        const { lendingAuctionNft, alice, treasure, atlasMine, magicDepositor } =
          await BaseFixture();
        const treasureTokendId = TREASURE_TOKEN_IDS[0];
        await depositTreasures(alice, treasure, lendingAuctionNft, treasureTokendId, amount);
        const treasureTokenBeforeBalance = await treasure.balanceOf(
          alice.address,
          treasureTokendId
        );
        const treasureBoostBefore = await atlasMine.getUserBoost(magicDepositor.address);
        const getBoostTreasureBefore = await atlasMine.getNftBoost(
          treasure.address,
          treasureTokendId,
          amount
        );
        const treasureUserBoostsBefore = await lendingAuctionNft.getTreasureUserBoosts();
        const mainTreasureUserBoostBefore = treasureUserBoostsBefore[0];
        const reserveTreasureUserBoostBefore = treasureUserBoostsBefore[1];

        expect(mainTreasureUserBoostBefore.length).to.equal(1);
        expect(reserveTreasureUserBoostBefore).to.be.empty;
        expect(getBoostTreasureBefore).to.equal(treasureBoostBefore);

        await expect(
          withdrawTreasures(alice, treasure, lendingAuctionNft, treasureTokendId, amount)
        )
          .to.emit(lendingAuctionNft, "Withdrawn")
          .withArgs(treasure.address, treasureTokendId, amount);
        const treasureTokenAfterBalance = await treasure.balanceOf(alice.address, treasureTokendId);
        const treasureBoostAfter = await atlasMine.getUserBoost(magicDepositor.address);
        const userTreasureBoostsIndexes = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokendId,
          amount
        );
        const treasureUserBoostsAfter = await lendingAuctionNft.getTreasureUserBoosts();
        const mainTreasureUserBoostAfter = treasureUserBoostsAfter[0];
        const reserveTreasureUserBoostAfter = treasureUserBoostsAfter[1];

        expect(mainTreasureUserBoostAfter).to.be.empty;
        expect(reserveTreasureUserBoostAfter).to.be.empty;
        expect(userTreasureBoostsIndexes[0]).to.be.empty;
        expect(userTreasureBoostsIndexes[1]).to.be.empty;
        expect(treasureTokenAfterBalance).to.equal(treasureTokenBeforeBalance.add(amount));
        expect(treasureBoostAfter).to.equal(0);
      });

      it("Should withdraw from reserve pool after multiple deposit", async () => {
        const amount = 10;
        const { lendingAuctionNft, alice, treasure } = await fixture();
        const treasureTokenId_0 = TREASURE_TOKEN_IDS[0];
        const beforeWithdrawTreasureUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const beforeWithdrawMainTreasureUserBoosts = beforeWithdrawTreasureUserBoosts[0];
        const beforeWithdrawReserveTreasureUserBoosts = beforeWithdrawTreasureUserBoosts[1];

        expect(beforeWithdrawMainTreasureUserBoosts.length).to.equal(2);
        expect(beforeWithdrawReserveTreasureUserBoosts.length).to.equal(1);

        const treasureUserBoostIndexes = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokenId_0,
          amount
        );

        const expectedReserveTreasureUserBoostIndexes = treasureUserBoostIndexes[1];

        expect(expectedReserveTreasureUserBoostIndexes.length).to.equal(1);
        expect(expectedReserveTreasureUserBoostIndexes[0]).to.equal(0);

        const expectedTreasureUserBoost = await lendingAuctionNft.getUserTreasureData(
          TreasureReservePool,
          expectedReserveTreasureUserBoostIndexes[0]
        );

        expect(beforeWithdrawReserveTreasureUserBoosts[0]).to.eql(expectedTreasureUserBoost);
        // Now we have 2 tokenId in mainPool
        // And 1 tokenId are in reserve Pool

        // MainPool => TREASURE_TOKEN_IDS[1],TREASURE_TOKEN_IDS[2]
        // ReservePool => TREASURE_TOKEN_IDS[0]

        // 1st withdrawing tokenId that are in reservePool which are
        // TREASURE_TOKEN_IDS[0]
        // Lets remove 1st tokenIds[0],no change in mainPool but
        // will be change in reservePool

        await withdrawTreasures(alice, treasure, lendingAuctionNft, treasureTokenId_0, amount);
        const afterWithdrawTreasureUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const afterWithdrawMainTreasureUserBoosts = beforeWithdrawTreasureUserBoosts[0];
        const afterWithdrawReserveTreasureUserBoosts = afterWithdrawTreasureUserBoosts[1];
        const afterWithdrawUserIndexTreasureBoosts =
          await lendingAuctionNft.getUserIndexTreasureBoosts(
            alice.address,
            treasureTokenId_0,
            amount
          );

        expect(afterWithdrawMainTreasureUserBoosts).to.be.eql(beforeWithdrawMainTreasureUserBoosts);
        expect(afterWithdrawReserveTreasureUserBoosts).to.be.empty;
        expect(afterWithdrawUserIndexTreasureBoosts[0]).to.be.empty;
        expect(afterWithdrawUserIndexTreasureBoosts[1]).to.be.empty;
      });

      it("Should withdraw from main pool after multiple deposit", async () => {
        // MainPool = 1,2
        // ReservePool = 0
        const amount = 10;
        const { lendingAuctionNft, alice, treasure } = await fixture();
        const treasureTokenId_0 = TREASURE_TOKEN_IDS[0];
        const treasureTokenId_1 = TREASURE_TOKEN_IDS[1];
        const beforeWithdrawTreasureUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const beforeWithdrawMainTreasureUserBoosts = beforeWithdrawTreasureUserBoosts[0];
        const beforeWithdrawReserveTreasureUserBoosts = beforeWithdrawTreasureUserBoosts[1];

        const expectedTreasureUserBoostIndexes = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokenId_1,
          amount
        );

        const treasureUserBoostIndexes = await lendingAuctionNft.getUserIndexTreasureBoosts(
          alice.address,
          treasureTokenId_0,
          amount
        );

        const expectedMainTreasureUserBoostIndexes = treasureUserBoostIndexes[0];
        const expectedReserveTreasureUserBoostIndexes = treasureUserBoostIndexes[1];

        expect(expectedMainTreasureUserBoostIndexes).to.empty;
        expect(expectedReserveTreasureUserBoostIndexes.length).to.equal(1);
        expect(expectedReserveTreasureUserBoostIndexes[0]).to.equal(0);
        const expectedReserveTreasureUserBoost = await lendingAuctionNft.getUserTreasureData(
          TreasureReservePool,
          expectedReserveTreasureUserBoostIndexes[0]
        );

        expect(beforeWithdrawReserveTreasureUserBoosts[0]).to.eql(expectedReserveTreasureUserBoost);
        // Now we have 2 tokenId in mainPool
        // And 1 tokenId are in reserve Pool

        // MainPool => TREASURE_TOKEN_IDS[1],TREASURE_TOKEN_IDS[2]
        // ReservePool => TREASURE_TOKEN_IDS[0]

        // 1st withdrawing tokenId that are in mainPool which are
        // TREASURE_TOKEN_IDS[1]
        // Lets remove 1st tokenIds[1], change in mainPool as well as
        // change in reservePool

        await withdrawTreasures(alice, treasure, lendingAuctionNft, treasureTokenId_1, amount);

        // removed tokendId1 from mainPool , reservePool higherBoost  will be replaced
        // MainPool => tokenId[2],tokenId[0]
        // ReservePool => []

        // Both tokendId2 and tokendId3 have same boost : 5000000000000(0.05)
        // but tokenID2 have higher time than tokenId3 , so tokenId2 will in mainPool
        const afterWithdrawTreasureUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const afterWithdrawMainTreasureUserBoosts = afterWithdrawTreasureUserBoosts[0];
        const afterWithdrawReserveTreasureUserBoosts = afterWithdrawTreasureUserBoosts[1];
        const afterWithdrawUserIndexTreasureBoosts =
          await lendingAuctionNft.getUserIndexTreasureBoosts(
            alice.address,
            treasureTokenId_1,
            amount
          );

        const afterWithdrawExpectedUserBoost: LendingAuctionNft.UserBoostStruct[] = [
          afterWithdrawMainTreasureUserBoosts[0],
          expectedReserveTreasureUserBoost,
        ];
        expect(afterWithdrawMainTreasureUserBoosts).to.eql(afterWithdrawExpectedUserBoost);

        expect(afterWithdrawReserveTreasureUserBoosts).to.be.empty;
        expect(afterWithdrawUserIndexTreasureBoosts[0]).to.be.empty;
        expect(afterWithdrawUserIndexTreasureBoosts[1]).to.be.empty;
      });
      it("Should Withdraw all treasures from reserve and main pool", async () => {
        const amount = 10;
        const { lendingAuctionNft, alice, treasure } = await fixture();
        const args = [
          [alice.address, alice.address, alice.address],
          [TREASURE_TOKEN_IDS[0], TREASURE_TOKEN_IDS[1], TREASURE_TOKEN_IDS[2]],
        ];
        // @ts-ignore
        const beforeWithdrawBobBalance = await treasure.balanceOfBatch(...args);
        await withdrawTreasures(alice, treasure, lendingAuctionNft, TREASURE_TOKEN_IDS[0], amount);
        await withdrawTreasures(alice, treasure, lendingAuctionNft, TREASURE_TOKEN_IDS[1], amount);
        await withdrawTreasures(alice, treasure, lendingAuctionNft, TREASURE_TOKEN_IDS[2], amount);
        // @ts-ignore
        const afterWithdrawBobBalance = await treasure.balanceOfBatch(...args);

        const expectedTreasureBalance = beforeWithdrawBobBalance.map((bal) => bal.add(amount));

        expect(afterWithdrawBobBalance).to.eql(expectedTreasureBalance);
        const afterWithdrawUserIndexTreasureBoosts =
          await lendingAuctionNft.getUserIndexTreasureBoosts(
            alice.address,
            TREASURE_TOKEN_IDS[0],
            amount
          );

        const afterWithdrawMainTreasureUserIndex = afterWithdrawUserIndexTreasureBoosts[0];
        const afterWithdrawReserveTreasureUserIndex = afterWithdrawUserIndexTreasureBoosts[1];

        const afterWithdrawTreasureUserBoosts = await lendingAuctionNft.getTreasureUserBoosts();
        const afterWithdrawMainTreasureUserBoosts = afterWithdrawTreasureUserBoosts[0];
        const afterWithdrawReserveTreasureUserBoosts = afterWithdrawTreasureUserBoosts[1];
        expect(afterWithdrawReserveTreasureUserBoosts).to.be.empty;
        expect(afterWithdrawMainTreasureUserBoosts).to.be.empty;
        expect(afterWithdrawMainTreasureUserIndex).to.be.empty;
        expect(afterWithdrawReserveTreasureUserIndex).to.be.empty;
      });
    });
  });
});
