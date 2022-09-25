const { ethers, upgrades } = require("hardhat");
const abi =
    require("../artifacts/contracts/label/LabelPinballhead.sol/LabelPinballhead.json").abi;

const PROXY = "0x8f74b37fcaef4434b74bcd8573ed758ce5c184bc";

async function main() {
    [owner] = await ethers.getSigners();

    pinballhead = new ethers.Contract(PROXY, abi, owner);

    const promises = []
    for (let i = 0; i < 10; i++) {
        try {
            console.time('code measure');
            const receipt = await pinballhead.mint(owner.address, 100);
            // console.log(receipt);
            console.timeEnd('code measure');
        } catch (e) {
            console.log(e);
        }
    }
    console.log("mint successfully");
}

async function checkTokenURI() {
    [owner] = await ethers.getSigners();

    pinballhead = new ethers.Contract(PROXY, abi, owner);

    const uri = await pinballhead.tokenURI(100);
    console.log(uri);
}

async function checkTransfer() {
    [owner] = await ethers.getSigners();

    pinballhead = new ethers.Contract(PROXY, abi, owner);
    for (let i = 1010; i < 1011; i++) {
        await pinballhead.transferFrom(owner.address, '0x6Ecb606D70c78Ea480DC204eB96EeAB6977aA37f', i);
    }
}

async function approveNFT() {
    [owner] = await ethers.getSigners();

    pinballhead = new ethers.Contract(PROXY, abi, owner);

    treasuryAddress = '0xCF2F55c2002Bb4DD5506a75D7C4F401cb2dDcC4F'
    const uri = await pinballhead.approve(treasuryAddress, 0);
    // console.log(uri);
}


main();
// checkTokenURI()
// checkTransfer()
// approveNFT()