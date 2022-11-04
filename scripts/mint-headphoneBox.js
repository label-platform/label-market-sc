const { ethers, upgrades } = require("hardhat");
const { check } = require("prettier");
const abi =
  require("../artifacts/contracts/label/LabelHeadphoneBox.sol/LabelHeadphoneBox.json").abi;

const PROXY = "0xA528DA12AD7dc3bb050773cc889E70fe2296c726";

const timeout = (time) =>
  new Promise((resolve, reject) => {
    console.log("timeout");
    setTimeout(resolve(), time);
  });

async function main() {
  [owner] = await ethers.getSigners();

  headphonebox = new ethers.Contract(PROXY, abi, owner);

  const promises = [];
  for (let i = 0; i < 71; i++) {
    try {
      console.time("code measure");
      const receit = await headphonebox.mint(owner.address, 100);
      console.log(receit);
      console.timeEnd("code measure");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } catch (e) {
      console.log(e);
    }
  }
  console.log("mint successfully");
}

async function checkTokenURI() {
  [owner] = await ethers.getSigners();

  headphonebox = new ethers.Contract(PROXY, abi, owner);

  const uri = await headphonebox.tokenURI(100);
  console.log(uri);
}

async function checkTransfer() {
  [owner] = await ethers.getSigners();

  headphonebox = new ethers.Contract(PROXY, abi, owner);
  for (let i = 1010; i < 1011; i++) {
    await headphonebox.transferFrom(
      owner.address,
      "0x6Ecb606D70c78Ea480DC204eB96EeAB6977aA37f",
      i
    );
  }
}

async function approveNFT() {
  [owner] = await ethers.getSigners();

  headphonebox = new ethers.Contract(PROXY, abi, owner);

  treasuryAddress = "0xCF2F55c2002Bb4DD5506a75D7C4F401cb2dDcC4F";
  const uri = await headphonebox.approve(treasuryAddress, 0);
  // console.log(uri);
}

main();
// checkTokenURI()
// checkTransfer()
// approveNFT()
