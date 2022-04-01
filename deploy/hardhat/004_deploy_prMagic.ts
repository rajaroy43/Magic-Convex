import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { PR_MAGIC_TOKEN_CONTRACT_NAME } from "../../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const { address } = await deploy(PR_MAGIC_TOKEN_CONTRACT_NAME, { from: deployer});
  if(hre.tracer)
  hre.tracer.nameTags[address] = "prMagicToken";
};
export default func;
func.tags = ["prMagicToken","live"];
