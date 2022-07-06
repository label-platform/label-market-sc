const { ethers } = require("hardhat");
// P Rights: 0x3e9Ef8545F18f6d89fa69F0750bbfce32d675063
// LabelArtWork 1155: 0x51F61D472400051da9aE6b7f5416F6D682d9a984
// LabelArtWork 721: 0xa85763E451fE2573C9174582BDb0ECEf36702B3D
// LabelCollection 1155: 0x0F4B12B8bc5c8Cd85D148e65EAf0D991Dd7F6f12
// LabelCollection 721: 0x74847e65818B46F1e84A6A9f5754b8E9C08bCde7

const abi =
    require("../artifacts/contracts/label/LabelArtWork1155.sol/LabelArtWork1155.json").abi;
async function main() {
    [owner] = await ethers.getSigners();

    const collections = [
        "0x3e9Ef8545F18f6d89fa69F0750bbfce32d675063",
        "0x51F61D472400051da9aE6b7f5416F6D682d9a984",
        "0xa85763E451fE2573C9174582BDb0ECEf36702B3D",
        "0x0F4B12B8bc5c8Cd85D148e65EAf0D991Dd7F6f12",
        "0x74847e65818B46F1e84A6A9f5754b8E9C08bCde7",
    ];

    for (let i = 0; i < collections.length; i++) {
        const collection = new ethers.Contract(collections[i], abi, owner);

        await collection.setMinterRole(
            ["0xc4c031a1513ddcc14b5705dcf97b14254e8ec727"],
            true
        );
    }

    // MM = await ethers.getContractFactory("MintingMachine");
    // mm = await MM.deploy([
    //     "0x3e9Ef8545F18f6d89fa69F0750bbfce32d675063",
    //     "0x51F61D472400051da9aE6b7f5416F6D682d9a984",
    //     "0xa85763E451fE2573C9174582BDb0ECEf36702B3D",
    //     "0x0F4B12B8bc5c8Cd85D148e65EAf0D991Dd7F6f12",
    //     "0x74847e65818B46F1e84A6A9f5754b8E9C08bCde7",
    // ]);
    // await mm.deployed();
    // console.log("Minting machine: " + mm.address);
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
