import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const { address } = await deploy("Precious", { from: deployer });
  if (hre.tracer) hre.tracer.nameTags[address] = "Precious";
};
export default func;
func.tags = ["Precious"];
