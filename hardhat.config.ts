import dotenv from "dotenv";
dotenv.config();

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-tracer";
import "@atixlabs/hardhat-time-n-mine";
import "@openzeppelin/hardhat-upgrades";
import "@primitivefi/hardhat-dodoc";

import { HardhatUserConfig, NetworksUserConfig } from "hardhat/types";
import { ARBITRUM_BLOCK_GAS_LIMIT } from "./utils/constants";

const { ETHERSCAN_API_KEY, NODE_URL } = process.env;

if (!NODE_URL) throw new Error(`Needs a NODE_URL to fork`);

let networks: NetworksUserConfig = {};

if (process.env.GOERLI) {
  networks["goerli"] = {
    url: process.env.GOERLI,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      deploy: ["./deploy/hardhat"],
      forking: {
        blockNumber: 8103787,
        url: NODE_URL,
      },
      blockGasLimit: ARBITRUM_BLOCK_GAS_LIMIT,
      allowUnlimitedContractSize: true,
    },
    localhost: {},
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
    ...networks,
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: 0,
  },
  mocha: {
    timeout: 0,
  },
  dodoc: {
    runOnCompile: true,
  },
};

export default config;
