const { ethers } = require("hardhat");

async function main() {
    MM = await ethers.getContractFactory("MatchingMachine");
    mm = await MM.deploy("0x2009e33E3401d7A2709BDEfc6BA6Ea2919c74F84");
    await mm.deployed();

    console.log("Matching machine: " + mm.address);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
