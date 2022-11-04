const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    address: "0x309D4C49a630CdFf573c3e0e630eCCa382F50D99",
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
