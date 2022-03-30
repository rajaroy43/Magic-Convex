import { ContractTransaction } from "ethers";

export const awaitTx = (tx: ContractTransaction | Promise<ContractTransaction>) => {
  return Promise.resolve(tx).then((tx) => tx.wait());
};
