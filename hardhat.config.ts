import dotenv from 'dotenv'
dotenv.config()

import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-etherscan'
import 'solidity-coverage'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'
import '@atixlabs/hardhat-time-n-mine'

import { HardhatUserConfig, NetworksUserConfig } from 'hardhat/types'

const { ETHERSCAN_API_KEY, NODE_URL } = process.env

if (!NODE_URL) throw new Error(`Needs a NODE_URL to fork`)

let networks: NetworksUserConfig = {}

if (process.env.GOERLI) {
  networks['goerli'] = {
    url: process.env.GOERLI,
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.11',
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
      deploy: ['./deploy/hardhat'],
      forking: {
        url: NODE_URL,
      },
    },
    localhost: {},
    coverage: {
      url: 'http://127.0.0.1:8555', // Coverage launches its own ganache-cli client
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
}

export default config
