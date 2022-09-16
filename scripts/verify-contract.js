const hre = require("hardhat");

async function main() {
    await hre.run("verify:verify", {
        address: "0x483cdb3c94DC63e1d6B2bEd383d04ff213204156",
        constructorArguments: [],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });