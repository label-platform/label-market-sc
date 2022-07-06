const { ethers, upgrades } = require("hardhat");

const PROXY = "0x74847e65818B46F1e84A6A9f5754b8E9C08bCde7";

async function main() {
    const LabelCollection = await ethers.getContractFactory(
        "LabelCollection721"
    );
    // await upgrades.forceImport(PROXY, LabelCollection, { kind: "uups" });

    console.log("Upgrading...");
    await upgrades.upgradeProxy(PROXY, LabelCollection);
    console.log("Upgraded successfully");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
