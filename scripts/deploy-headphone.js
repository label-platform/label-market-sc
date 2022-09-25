const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const LABEL_HEADPHONE_BASE_URI = 'https://api.tracks.label.community/tracksheadphone/';
const HEADPHONE_CREATORS = ["0x8eb9f52858d830aC99011eB1Bdf7095B0eE3B958"];
const HEADPHONE_ROYALTIES = [10000]; // 10000 = 100% of total royalties
const HEADPHONE_TOTAL_ROYALTIES = 400; // 100 = 1%

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    [owner] = await ethers.getSigners();

    HEADPHONE = await ethers.getContractFactory("LabelHeadphone");
    headphone = await upgrades.deployProxy(
        HEADPHONE,
        [
            LABEL_HEADPHONE_BASE_URI,
            // PFP_SUPPLY_CAP,
            HEADPHONE_CREATORS,
            HEADPHONE_ROYALTIES,
            HEADPHONE_TOTAL_ROYALTIES,
        ],
        {
            kind: "uups",
        }
    );
    await headphone.deployed();

    console.log("HEADPHONE Collection: " + headphone.address);

    console.log("-----------SETTINGS AFTER DEPLOY-----------");

    console.log("-----------DONE-----------");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// 60.6256 TBNB로 시작 -> 60.5922 TBNB