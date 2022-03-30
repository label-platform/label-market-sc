const { ethers } = require("hardhat");

async function main() {
    ERC20 = await ethers.getContractFactory("MockLabel");
    erc20 = await ERC20.deploy();
    await erc20.deployed();

    console.log("Mock Label token: " + erc20.address);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
