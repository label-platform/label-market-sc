const { ethers, upgrades } = require("hardhat");
const abi =
    require("../artifacts/contracts/label/LabelCollection.sol/LabelCollection.json").abi;

const PROXY = "0xCe9344f841616f2E8B1320F45322eD8c34A91749";

async function main() {
    [owner] = await ethers.getSigners();

    nft = new ethers.Contract(PROXY, abi, owner);

    await nft.setURI("");

    console.log("setURI successfully");
}

main();
