import { ethers } from "hardhat";

export const Ether = (val: number | string) => {
  return ethers.utils.parseEther(val.toString());
};

export async function advanceBlock() {
  return ethers.provider.send("evm_mine", []);
}

export async function advanceBlockTo(blockNumber: number) {
  for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
    await advanceBlock();
  }
}
