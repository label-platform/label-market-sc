const { ethers, upgrades, network } = require("hardhat");

const abi =
    require("../artifacts/contracts/label/PaymentManager.sol/PaymentManager.json").abi;

const PROXY = "0x796C192f28a79108d1F5d9A5Bc2dd9dC20198bb1";

const REGISTRY_ADDRESS = "0x6215519f4296cADfaF3DD7f5177C59e892395c37";

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    [owner] = await ethers.getSigners();

    IP = await ethers.getContractFactory("LabelIPRights");
    ip = await upgrades.deployProxy(IP, ["", REGISTRY_ADDRESS], {
        kind: "uups",
    });
    await ip.deployed();

    console.log("IP Rights: " + ip.address);

    A1155 = await ethers.getContractFactory("LabelArtWork1155");
    a1155 = await upgrades.deployProxy(A1155, ["", REGISTRY_ADDRESS], {
        kind: "uups",
    });
    await a1155.deployed();

    console.log("LabelArtWork 1155: " + a1155.address);

    A721 = await ethers.getContractFactory("LabelArtWork721");
    a721 = await upgrades.deployProxy(A721, ["", REGISTRY_ADDRESS], {
        kind: "uups",
    });
    await a721.deployed();

    console.log("LabelArtWork 721: " + a721.address);

    ERC1155 = await ethers.getContractFactory("LabelCollection1155");
    erc1155 = await upgrades.deployProxy(ERC1155, ["", REGISTRY_ADDRESS], {
        kind: "uups",
    });
    await erc1155.deployed();

    console.log("LabelCollection 1155: " + erc1155.address);

    ERC721 = await ethers.getContractFactory("LabelCollection721");
    erc721 = await upgrades.deployProxy(ERC721, ["", REGISTRY_ADDRESS], {
        kind: "uups",
    });
    await erc721.deployed();

    console.log("LabelCollection 721: " + erc721.address);

    console.log("-----------SET COLLECTIONS-----------");

    payment = new ethers.Contract(PROXY, abi, owner);

    await payment.setLabelCollection(ip.address, true);
    await payment.setLabelCollection(a1155.address, true);

    await payment.setLabelCollection(a721.address, true);

    await payment.setLabelCollection(erc1155.address, true);

    await payment.setLabelCollection(erc721.address, true);

    console.log("-----------DONE-----------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
// IP Rights: 0x3e9Ef8545F18f6d89fa69F0750bbfce32d675063
// LabelArtWork 1155: 0x51F61D472400051da9aE6b7f5416F6D682d9a984
// LabelArtWork 721: 0xa85763E451fE2573C9174582BDb0ECEf36702B3D
// LabelCollection 1155: 0x0F4B12B8bc5c8Cd85D148e65EAf0D991Dd7F6f12
// LabelCollection 721: 0x74847e65818B46F1e84A6A9f5754b8E9C08bCde7
