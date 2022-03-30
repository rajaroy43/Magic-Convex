import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  ATLAS_MINE_ADDRESS,
  LEGION_NFT_ADDRESS,
  TREASURE_NFT_ADDRESS,
} from "../../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();
  const { address: magicNftStakingAddress } = await deploy("MagicNftStaking", {
    args: [ATLAS_MINE_ADDRESS, TREASURE_NFT_ADDRESS, LEGION_NFT_ADDRESS],
    from: deployer,
  });
  hre.tracer.nameTags[magicNftStakingAddress] = "MagicNftStaking";
};

export default func;
func.tags = ["MagicNftStaking"];
