const hre = require("hardhat");
const { upgrades } = hre;

async function main() {
  const MysteryBox = await hre.ethers.getContractFactory("LabelMysteryBox");

  // Upgrade proxy
  const mysteryBox = await upgrades.upgradeProxy(
    "0x9f3af0e8482164a2890e9312b7638e5c2b9a218c",
    MysteryBox
  );
  await mysteryBox.deployed();

  console.log("Completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
