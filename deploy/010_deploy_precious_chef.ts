import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Precious, LendingAuctionNft, PreciousChef__factory } from "../typechain";
import {
  PRECIOUS_PER_BLOCK,
  LEGION_MAIN_POOL_ALLOCATION,
  LEGION_RESERVE_POOL_ALLOCATION,
  TREASURE_MAIN_POOL_ALLOCATION,
  TREASURE_RESERVE_POOL_ALLOCATION,
} from "../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre;
  const { deployer } = await getNamedAccounts();

  const precious = (await getContract("Precious")) as Precious;
  const { address: preciousAddress } = precious;
  const lendingAuctionNft = (await getContract("LendingAuctionNft")) as LendingAuctionNft;
  const { address: lendingAuctionNftAddress, signer } = lendingAuctionNft;

  const { address: preciousChefAddress } = await deploy("PreciousChef", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [preciousAddress, PRECIOUS_PER_BLOCK, lendingAuctionNftAddress],
        },
      },
    },
  });

  await lendingAuctionNft.setPreciousChef(preciousChefAddress);
  const preciousChef = PreciousChef__factory.connect(preciousChefAddress, signer);
  await preciousChef.addPool(LEGION_MAIN_POOL_ALLOCATION);
  await preciousChef.addPool(LEGION_RESERVE_POOL_ALLOCATION);
  await preciousChef.addPool(TREASURE_MAIN_POOL_ALLOCATION);
  await preciousChef.addPool(TREASURE_RESERVE_POOL_ALLOCATION);

  if (hre.tracer) hre.tracer.nameTags[preciousChefAddress] = "PreciousChef";
};
export default func;
func.tags = ["PreciousChef", "live"];
func.dependencies = ["Precious", "LendingAuctionNft"];
