require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.7.5",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },

    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            gas: 120000000,
            blockGasLimit: 0x1fffffffffffff,
            timeout: 1800000,
            // allowUnlimitedContractSize: true,
            chainId: 56,
            forking: {
                url: "https://speedy-nodes-nyc.moralis.io/feb2772b66e2a0a57e78beaa/bsc/mainnet",
                // blockNumber: 19309700,
            },

            // chainId: 97,
            // forking: {
            //     url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            //     blockNumber: 19975376,
            // },
        },

        local: {
            url: "http://127.0.0.1:8545/",
            gas: 12000000,
            blockGasLimit: 0x1fffffffffffff,
            allowUnlimitedContractSize: true,
            timeout: 1800000,
            chainId: 97,
        },

        testBSC: {
            // url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            url: "https://speedy-nodes-nyc.moralis.io/feb2772b66e2a0a57e78beaa/bsc/testnet",

            accounts: [process.env.PRIVATE_KEY], // 0xf9128f6E4faF9fc364a6d737221a93E9b97CBC68
            gas: 12000000,
            blockGasLimit: 0x1fffffffffffff,
            allowUnlimitedContractSize: true,
            timeout: 100000000,
            chainId: 97,
        },

        mainnetBSC: {
            url: "https://bsc-dataseed.binance.org/",
            accounts: [process.env.PRIVATE_KEY],
            chainId: 56,
        },
    },

    etherscan: {
        apiKey: process.env.ETHERSCAN_APIKEY, // bsc
    },

    mocha: {
        timeout: 1800000,
    },

    gasReporter: {
        enabled: false,
        currency: "USD",
    },

    // contractSizer: {
    //   alphaSort: true,
    //   disambiguatePaths: false,
    //   runOnCompile: true,
    //   strict: true,
    // }
};
