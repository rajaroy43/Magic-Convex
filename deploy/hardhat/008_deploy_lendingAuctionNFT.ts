import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  ATLAS_MINE_ADDRESS,
  TREASURE_NFT_ADDRESS,
  LEGION_NFT_ADDRESS,
  MAGIC_DEPOSITOR_CONTRACT_NAME,
  LENDING_AUCTION_NFT_CONTRACT_NAME
} from "../../utils/constants";
import { MagicDepositor } from "../../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre;
  const { deployer } = await getNamedAccounts();
  
  const { address: lendingAuctionNftAddress } = await deploy(LENDING_AUCTION_NFT_CONTRACT_NAME, {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            TREASURE_NFT_ADDRESS,
            LEGION_NFT_ADDRESS,
            ATLAS_MINE_ADDRESS
          ],
        },
      },
    },
  });

  if (hre.tracer) hre.tracer.nameTags[lendingAuctionNftAddress] = LENDING_AUCTION_NFT_CONTRACT_NAME;
};

export default func;
func.tags = ["LendingAuctionNft", "live"];
