const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const TRACKS_TREASURY_ADMIN_WALLET = '0xcEA695c0F108833f347239bB2f05CEF06F6a7658';
// const TREASURY_CREATORS = ["0x8eb9f52858d830aC99011eB1Bdf7095B0eE3B958"];
// const TREASURY_ROYALTIES = [10000]; // 10000 = 100% of total royalties
// const TREASURY_TOTAL_ROYALTIES = 400; // 100 = 1%

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    [owner] = await ethers.getSigners();

    TREASURY = await ethers.getContractFactory("TreasuryContract");
    treasury = await upgrades.deployProxy(
        TREASURY,
        [
            TRACKS_TREASURY_ADMIN_WALLET,
        ],
        // {
        //     kind: "uups",
        // }
    );
    await treasury.deployed();

    console.log("TracksTreasury: " + treasury.address);

    console.log("-----------SETTINGS AFTER DEPLOY-----------");

    console.log("-----------DONE-----------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
