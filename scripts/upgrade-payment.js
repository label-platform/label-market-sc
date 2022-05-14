const { ethers, upgrades } = require("hardhat");

const PROXY = "0x5b9432dBe4F06b6998Af2e57a9114AB3CCD2ddE5";

async function main() {
    const PaymentManager = await ethers.getContractFactory("PaymentManager");
    // await upgrades.forceImport(PROXY, PaymentManager, { kind: "uups" });

    console.log("Upgrading...");
    await upgrades.upgradeProxy(PROXY, PaymentManager, {
        kind: "uups",
    });
    console.log("Upgraded successfully");
}

main();
