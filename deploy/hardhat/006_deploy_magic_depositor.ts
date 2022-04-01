import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  MAGIC_TOKEN_ADDRESS,
  ATLAS_MINE_ADDRESS,
  TREASURE_NFT_ADDRESS,
  LEGION_NFT_ADDRESS,
  PR_MAGIC_TOKEN_CONTRACT_NAME,
  MAGIC_DEPOSITOR_CONTRACT_NAME,
} from "../../utils/constants";
import { MagicDepositor, PrMagicToken } from "../../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre;
  const { deployer } = await getNamedAccounts();

  const prMagicToken = (await getContract(PR_MAGIC_TOKEN_CONTRACT_NAME)) as PrMagicToken;

  const { address: magicDepositorAddress } = await deploy(MAGIC_DEPOSITOR_CONTRACT_NAME, {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            MAGIC_TOKEN_ADDRESS,
            prMagicToken.address,
            ATLAS_MINE_ADDRESS,
            TREASURE_NFT_ADDRESS,
            LEGION_NFT_ADDRESS,
          ],
        },
      },
    },
  });

  await prMagicToken.transferOwnership(magicDepositorAddress).then((tx) => tx.wait());
  if(hre.tracer)
  hre.tracer.nameTags[magicDepositorAddress] = "MagicDepositor";
};

export default func;
func.tags = ["MagicDepositor","live"];
