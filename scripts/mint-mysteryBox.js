const { ethers, upgrades } = require("hardhat");
const { check } = require("prettier");
const abi =
    require("../artifacts/contracts/label/LabelMysteryBox.sol/LabelMysteryBox.json").abi;

const PROXY = "0x9f3Af0E8482164a2890E9312B7638e5c2B9A218C";

async function main() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    const promises = []
    for (let i = 0; i < 2; i++) {
        try {
            console.time('code measure');
            const receit = await mysterybox.mint(owner.address, 100);
            console.log(receit);
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
    for (let i = 1010; i < 1011; i++) {
        await mysterybox.transferFrom(owner.address, '0x6Ecb606D70c78Ea480DC204eB96EeAB6977aA37f', i);
    }
}

async function approveNFT() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    treasuryAddress = '0xCF2F55c2002Bb4DD5506a75D7C4F401cb2dDcC4F'
    const uri = await mysterybox.approve(treasuryAddress, 0);
    // console.log(uri);
}


// main();
// checkTokenURI()
// checkTransfer()
approveNFT()
