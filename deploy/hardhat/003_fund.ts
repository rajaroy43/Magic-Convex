import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  RICH_USER_ADDRESS,
  MAGIC_TOKEN_ADDRESS,
  SECONDARY_RICH_USER_ADDRESS,
  ATLAS_MASTER_OF_COIN_ADDRESS,
  ATLAS_MASTER_OF_COIN_ROLE,
  ONE_YEAR_IN_SECONDS,
  ATLAS_MINE_ADDRESS,
  LEGION_NFT_ADDRESS,
  TREASURE_NFT_ADDRESS,
  TREASURE_TOKEN_IDS,
  LEGION_TOKEN_IDS,
} from "../../utils/constants";
import {
  IERC1155__factory,
  IERC20__factory,
  IERC721__factory,
  MasterOfCoin__factory,
} from "../../typechain";
import { ethers, timeAndMine } from "hardhat";
import { impersonate } from "../../utils/Impersonate";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const token = IERC20__factory.connect(MAGIC_TOKEN_ADDRESS, hre.ethers.provider);
  const masterOfCoin = MasterOfCoin__factory.connect(
    ATLAS_MASTER_OF_COIN_ADDRESS,
    hre.ethers.provider
  );
  const legion = IERC721__factory.connect(LEGION_NFT_ADDRESS, hre.ethers.provider);
  const treasure = IERC1155__factory.connect(TREASURE_NFT_ADDRESS, hre.ethers.provider);

  const [alice, bob, carol] = await ethers.getSigners();

  {
    await impersonate(RICH_USER_ADDRESS, alice, hre);
    const signer = hre.ethers.provider.getSigner(RICH_USER_ADDRESS);

    const balance = await token.balanceOf(RICH_USER_ADDRESS);
    await token.connect(signer).transfer(alice.address, balance);

    await Promise.all(
      LEGION_TOKEN_IDS.map(async (id) => {
        const owner = await legion.ownerOf(id);
        await impersonate(owner, alice, hre);
        const signer = hre.ethers.provider.getSigner(owner);
        await legion.connect(signer).transferFrom(owner, alice.address, id);
      })
    );

    const treasureTokenAmounts = await Promise.all(
      TREASURE_TOKEN_IDS.map(async (id) => {
        return await treasure.balanceOf(RICH_USER_ADDRESS, id);
      })
    );

    const batchTransferArgs = [
      RICH_USER_ADDRESS,
      alice.address,
      TREASURE_TOKEN_IDS,
      treasureTokenAmounts,
      "0x",
    ];
    // @ts-ignore
    await treasure.connect(signer).safeBatchTransferFrom(...batchTransferArgs);
  }

  /** Hack to work around precision issues in AtlasMine */
  {
    await impersonate(SECONDARY_RICH_USER_ADDRESS, alice, hre);

    const secondaryRichUser = hre.ethers.provider.getSigner(SECONDARY_RICH_USER_ADDRESS);
    const balance = await token.balanceOf(SECONDARY_RICH_USER_ADDRESS);

    await token.connect(secondaryRichUser).transfer(ATLAS_MASTER_OF_COIN_ADDRESS, balance);
    const masterOfCoinAdminAddress = await masterOfCoin.getRoleMember(ATLAS_MASTER_OF_COIN_ROLE, 0);
    const masterOfCoinAdmin = await impersonate(masterOfCoinAdminAddress, alice, hre);
    await masterOfCoin.connect(masterOfCoinAdmin).fundStream(ATLAS_MINE_ADDRESS, balance);

    let { timestamp } = await hre.ethers.provider.getBlock("latest");
    await timeAndMine.setTimeNextBlock(++timestamp);
    await masterOfCoin
      .connect(masterOfCoinAdmin)
      .updateStreamTime(ATLAS_MINE_ADDRESS, ++timestamp, timestamp + ONE_YEAR_IN_SECONDS * 2);
  }

  hre.tracer.nameTags[alice.address] = "alice";
  hre.tracer.nameTags[bob.address] = "bob";
  hre.tracer.nameTags[carol.address] = "carol";
};
export default func;
func.tags = ["fund"];
