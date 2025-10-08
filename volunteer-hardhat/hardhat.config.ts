import "dotenv/config";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const INFURA_API_KEY = process.env.INFURA_API_KEY ?? "";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: INFURA_API_KEY ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}` : SEPOLIA_RPC,
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
    deploy: "deploy",
    deployments: "deployments"
  }
};

export default config;


