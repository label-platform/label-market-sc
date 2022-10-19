const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    address: "0x6b31d97847fb6027d854643ca7f5849011e97b51",
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
