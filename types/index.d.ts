// Index hardhat plugin time&mine types

// @ts-ignore
import * as Hardhat from "hardhat/types/runtime";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    timeAndMine: {
      mine(blocks: number): Promise<void>;
      setTime(timestamp: number): Promise<void>;
      setTimeNextBlock(timestamp: number): Promise<void>;
      increaseTime(seconds: number): Promise<void>;
      setTimeIncrease(seconds: number): Promise<void>;
    };
  }
}
