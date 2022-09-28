const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const LabelStaticMarket = await ethers.getContractFactory(
    "LabelStaticMarket"
  );
  const labelStaticMarket = await LabelStaticMarket.deploy();
  await labelStaticMarket.deployed();

  console.log("StaticMarket deployed: " + labelStaticMarket.address);

  await hre.run("verify:verify", {
    address: labelStaticMarket.address,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
