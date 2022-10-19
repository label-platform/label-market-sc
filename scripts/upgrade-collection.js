const { ethers, upgrades } = require("hardhat");

const PBHPROXY = "0x5EBBFc265d14078D4ae6051B531FEDF48a972C7e";
const HEADPHONEPROXY = "0x3aE076721701d9d0a592767c39F5c08a74eE4E35";
const HEADPHONEBOXPROXY = "0x847b500692268587d7DB3793F88e07ff52849376";

async function main() {
  // const PBH = await ethers.getContractFactory("LabelPinballhead");
  // const Headphone = await ethers.getContractFactory("LabelHeadphone");
  const HeadphoneBox = await ethers.getContractFactory("LabelHeadphoneBox");
  //   await upgrades.forceImport(PBHPROXY, PBH, { kind: "uups" });
  //   await upgrades.forceImport(HEADPHONEPROXY, Headphone, { kind: "uups" });
  // await upgrades.forceImport(HEADPHONEBOXPROXY, HeadphoneBox, { kind: "uups" });

  console.log("Upgrading...");
  // await upgrades.upgradeProxy(PBHPROXY, PBH);
  // await upgrades.upgradeProxy(HEADPHONEPROXY, Headphone);
  await upgrades.upgradeProxy(HEADPHONEBOXPROXY, HeadphoneBox);
  console.log("Upgraded successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
