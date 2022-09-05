require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  //solidity: "0.8.8",
  solidity: {
    compilers: [
      {version: "0.8.8"},
      {version: "0.6.6"}
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337
    },
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts:[PRIVATE_KEY],
      chainId: 4,
      blockConfirmations: 6,
    }
  },
  gasReporter: {
    enabled: true, // to not use reporter set to false
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY, //gets us the cost in USD
    token: "ETH", // this selects a particular network
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    }
    
  }
};
