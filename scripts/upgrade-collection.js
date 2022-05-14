const { ethers, upgrades } = require("hardhat");

const PROXY = "0xCe9344f841616f2E8B1320F45322eD8c34A91749";

async function main() {
    const LabelCollection = await ethers.getContractFactory("LabelCollection");
    // await upgrades.forceImport(PROXY, LabelCollection, { kind: "uups" });

    console.log("Upgrading...");
    await upgrades.upgradeProxy(PROXY, LabelCollection);
    console.log("Upgraded successfully");
}

main();
