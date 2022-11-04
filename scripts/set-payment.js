const { ethers, upgrades } = require("hardhat");
const abi =
  require("../artifacts/contracts/label/PaymentManager.sol/PaymentManager.json").abi;

const PROXY = "0xCF69f121CD24Fe5570518d94EF37E5f79B12b681";

async function main() {
  [owner] = await ethers.getSigners();

  const paymentManager = new ethers.Contract(PROXY, abi, owner);

  console.log("setLabelCollection...");
  await paymentManager.setLabelCollection(
    "0xA528DA12AD7dc3bb050773cc889E70fe2296c726",
    true
  );

  console.log("setLabelCollection successfully");
}

main();
