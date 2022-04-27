import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { saveContract } from "../utils/SaveContract";
import {
  ATLAS_MASTER_OF_COIN_ADDRESS,
  ATLAS_MINE_ADDRESS,
  ATLAS_MINE_IMPLEMENTATION_ADDRESS,
  LEGION_NFT_ADDRESS,
  TREASURE_NFT_ADDRESS,
} from "../utils/constants";
import {
  AtlasMine__factory,
  IMasterOfCoin__factory,
  IERC1155__factory,
  IERC721__factory,
} from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { abi: atlasMineAbi } = AtlasMine__factory;
  const { abi: masterOfCoinAbi } = IMasterOfCoin__factory;
  const { abi: treasureAbi } = IERC1155__factory;
  const { abi: legionAbi } = IERC721__factory;

  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const { deployedBytecode } = await deploy("AtlasMine", { from: deployer });
  if (!deployedBytecode) throw new Error("AtlasMine debug implementation could not be deployed");

  await hre.network.provider.send("hardhat_setCode", [
    ATLAS_MINE_IMPLEMENTATION_ADDRESS,
    deployedBytecode,
  ]);
  await saveContract(hre, "AtlasMine", ATLAS_MINE_ADDRESS, atlasMineAbi);
  await saveContract(hre, "MasterOfCoin", ATLAS_MASTER_OF_COIN_ADDRESS, masterOfCoinAbi);
  // Legion and treasurere
  await saveContract(hre, "treasure", TREASURE_NFT_ADDRESS, treasureAbi);
  await saveContract(hre, "legion", LEGION_NFT_ADDRESS, legionAbi);
};
export default func;
func.tags = ["AtlasMine"];
