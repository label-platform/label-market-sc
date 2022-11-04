const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const LABEL_HEADPHONEBOX_BASE_URI =
  "https://api.tracks.label.community/tracksheadphonebox/";
const HEADPHONEBOX_CREATORS = ["0x864C8e71C8394cbF829e06b25512C8943D94Ef81"];
const HEADPHONEBOX_ROYALTIES = [10000]; // 10000 = 100% of total royalties
const HEADPHONEBOX_TOTAL_ROYALTIES = 400; // 100 = 1%

async function main() {
  console.log("-----------DEPLOYMENT STARTED-----------");

  [owner] = await ethers.getSigners();

  HEADPHONEBOX = await ethers.getContractFactory("LabelHeadphoneBox");
  headphonebox = await upgrades.deployProxy(
    HEADPHONEBOX,
    [
      LABEL_HEADPHONEBOX_BASE_URI,
      // PFP_SUPPLY_CAP,
      HEADPHONEBOX_CREATORS,
      HEADPHONEBOX_ROYALTIES,
      HEADPHONEBOX_TOTAL_ROYALTIES,
    ],
    {
      kind: "uups",
    }
  );
  await headphonebox.deployed();

  console.log("HEADPHONEBOX Collection: " + headphonebox.address);

  console.log("-----------SETTINGS AFTER DEPLOY-----------");

  console.log("-----------DONE-----------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// 60.6256 TBNB로 시작 -> 60.5922 TBNB
