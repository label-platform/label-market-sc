const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const FEE_RECEIVER = "0x28f89275cD7Ce2576d467BC85Fe42fE2324B2212";

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    // Registry = await ethers.getContractFactory("WyvernRegistry");
    // registry = await Registry.deploy();
    // await registry.deployed();
    // console.log("WyvernRegistry: " + registry.address);

    // Exchange = await ethers.getContractFactory("WyvernExchange");
    // exchange = await Exchange.deploy(CHAIN_ID, [registry.address], "0x");
    // await exchange.deployed();
    // console.log("WyvernExchange: " + exchange.address);

    // ERC1155 = await ethers.getContractFactory("LabelCollection");
    // erc1155 = await upgrades.deployProxy(
    //     ERC1155,
    //     ["ipfs://", registry.address],
    //     {
    //         kind: "uups",
    //     }
    // );
    // await erc1155.deployed();

    // console.log("LabelCollection: " + erc1155.address);

    // platformFeeRecipient = FEE_RECEIVER;
    // platformFee = 250; // 2.5%

    // PaymentManager = await ethers.getContractFactory("PaymentManager");
    // payment = await upgrades.deployProxy(
    //     PaymentManager,
    //     [erc1155.address, platformFeeRecipient, platformFee],
    //     {
    //         kind: "uups",
    //     }
    // );
    // await payment.deployed();

    // console.log("PaymentManager: " + payment.address);

    StaticMarket = await ethers.getContractFactory("LabelStaticMarket");
    let statici = await StaticMarket.deploy();
    await statici.deployed();

    console.log("StaticMarket: " + statici.address);

    // console.log("-----------SETTINGS AFTER DEPLOY-----------");

    // await registry.grantInitialAuthentication(exchange.address);

    console.log("-----------DONE-----------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
