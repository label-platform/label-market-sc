const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const LABEL_MYSTERYBOX_BASE_URI = 'https://api.tracks.label.community/v1/mysterybox/';
const MYSTERYBOX_CREATORS = ["0x8eb9f52858d830aC99011eB1Bdf7095B0eE3B958"];
const MYSTERYBOX_ROYALTIES = [10000]; // 10000 = 100% of total royalties
const MYSTERYBOX_TOTAL_ROYALTIES = 400; // 100 = 1%

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    [owner] = await ethers.getSigners();

    MYSTERYBOX = await ethers.getContractFactory("LabelMysteryBox");
    mysterybox = await upgrades.deployProxy(
        MYSTERYBOX,
        [
            LABEL_MYSTERYBOX_BASE_URI,
            // PFP_SUPPLY_CAP,
            MYSTERYBOX_CREATORS,
            MYSTERYBOX_ROYALTIES,
            MYSTERYBOX_TOTAL_ROYALTIES,
        ],
        {
            kind: "uups",
        }
    );
    await mysterybox.deployed();

    console.log("MYSTERYBOX Collection: " + mysterybox.address);

    console.log("-----------SETTINGS AFTER DEPLOY-----------");

    console.log("-----------DONE-----------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// 60.6256 TBNB로 시작 -> 60.5922 TBNB