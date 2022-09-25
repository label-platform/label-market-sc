const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const LABEL_PINBALLHEAD_BASE_URI = 'https://api.tracks.label.community/trackspinballhead/';
const PINBALLHEAD_SUPPLY_CAP = 10000;
const PINBALLHEAD_CREATORS = ["0x8eb9f52858d830aC99011eB1Bdf7095B0eE3B958"];
const PINBALLHEAD_ROYALTIES = [10000]; // 10000 = 100% of total royalties
const PINBALLHEAD_TOTAL_ROYALTIES = 400; // 100 = 1%

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    [owner] = await ethers.getSigners();

    PINBALLHEAD = await ethers.getContractFactory("LabelPinballhead");
    pinballhead = await upgrades.deployProxy(
        PINBALLHEAD,
        [
            LABEL_PINBALLHEAD_BASE_URI,
            PINBALLHEAD_SUPPLY_CAP,
            PINBALLHEAD_CREATORS,
            PINBALLHEAD_ROYALTIES,
            PINBALLHEAD_TOTAL_ROYALTIES,
        ],
        {
            kind: "uups",
        }
    );
    await pinballhead.deployed();

    console.log("PINBALLHEAD Collection: " + pinballhead.address);

    console.log("-----------SETTINGS AFTER DEPLOY-----------");

    console.log("-----------DONE-----------");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// 60.6256 TBNB로 시작 -> 60.5922 TBNB