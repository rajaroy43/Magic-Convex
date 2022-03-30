import { ABI, Receipt } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export const saveContract = async (
  hre: HardhatRuntimeEnvironment,
  name: string,
  address: string,
  abi: ABI,
  receipt?: Receipt
) => {
  const {
    deployments: { save },
  } = hre;
  await save(name, { abi, address, receipt });
};
