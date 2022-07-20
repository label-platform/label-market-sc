const { ethers, upgrades } = require("hardhat");
const { check } = require("prettier");
const abi =
    require("../artifacts/contracts/label/LabelMysteryBox.sol/LabelMysteryBox.json").abi;

const PROXY = "0x9f3Af0E8482164a2890E9312B7638e5c2B9A218C";

async function main() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    const promises = []
    for (let i = 0; i < 100; i++) {
        try{
            console.time('code measure');
            await mysterybox.mint(owner.address, 100);
            console.timeEnd('code measure');
        } catch (e) {
            console.log(e);
        }
    }
    console.log("mint successfully");
}

async function checkTokenURI() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    const uri = await mysterybox.tokenURI(100);
    console.log(uri);
}

async function checkTransfer() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    await mysterybox.transferFrom(owner.address, '0xcEA695c0F108833f347239bB2f05CEF06F6a7658', 9999);
}


main();
// checkTokenURI()
// checkTransfer()