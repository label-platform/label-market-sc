const { ethers, upgrades, network } = require("hardhat");

const CHAIN_ID = network.config.chainId;

const FEE_RECEIVER = "0x05DEd0baaE58E2D242679463bCfeCdfc7a937644"; // platform fee receiver
const PLATFORM_FEE = 250; // 2.5%
const LABEL_COLLECTION_1155_BASE_URI = "";
const LABEL_COLLECTION_721_BASE_URI = "";
const LABEL_ARTWORK_721_BASE_URI = "";
const LABEL_ARTWORK_1155_BASE_URI = "";
const LABEL_IP_RIGHTS_BASE_URI = "";
const LABEL_PFP_BASE_URI = "";
const LABEL_HEADPHONE_BASE_URI = "";

const PFP_SUPPLY_CAP = 9999;
const PFP_CREATORS = ["0x0000000000000000000000000000000000000000"];
const PFP_ROYALTIES = [10000]; // 10000 = 100% of total royalties
const PFP_TOTAL_ROYALTIES = 0; // 100 = 1%

const HP_SUPPLY_CAP = 9999;
const HP_CREATORS = ["0x0000000000000000000000000000000000000000"];
const HP_ROYALTIES = [10000]; // 10000 = 100% of total royalties
const HP_TOTAL_ROYALTIES = 0; // 100 = 1%

async function main() {
    console.log("-----------DEPLOYMENT STARTED-----------");

    [owner] = await ethers.getSigners();

    Registry = await ethers.getContractFactory("WyvernRegistry");
    registry = await Registry.deploy();
    await registry.deployed();
    console.log("WyvernRegistry: " + registry.address);

    Exchange = await ethers.getContractFactory("WyvernExchange");
    exchange = await Exchange.deploy(CHAIN_ID, [registry.address], "0x");
    await exchange.deployed();
    console.log("WyvernExchange: " + exchange.address);

    IP = await ethers.getContractFactory("LabelIPRights");
    ip = await upgrades.deployProxy(
        IP,
        [LABEL_IP_RIGHTS_BASE_URI, registry.address],
        {
            kind: "uups",
        }
    );
    await ip.deployed();

    console.log("IP Rights: " + ip.address);

    A1155 = await ethers.getContractFactory("LabelArtWork1155");
    a1155 = await upgrades.deployProxy(
        A1155,
        [LABEL_ARTWORK_1155_BASE_URI, registry.address],
        {
            kind: "uups",
        }
    );
    await a1155.deployed();

    console.log("LabelArtWork 1155: " + a1155.address);

    A721 = await ethers.getContractFactory("LabelArtWork721");
    a721 = await upgrades.deployProxy(
        A721,
        [LABEL_ARTWORK_721_BASE_URI, registry.address],
        {
            kind: "uups",
        }
    );
    await a721.deployed();

    console.log("LabelArtWork 721: " + a721.address);

    ERC1155 = await ethers.getContractFactory("LabelCollection1155");
    erc1155 = await upgrades.deployProxy(
        ERC1155,
        [LABEL_COLLECTION_1155_BASE_URI, registry.address],
        {
            kind: "uups",
        }
    );
    await erc1155.deployed();

    console.log("LabelCollection: " + erc1155.address);

    ERC721 = await ethers.getContractFactory("LabelCollection721");
    erc721 = await upgrades.deployProxy(
        ERC721,
        [LABEL_COLLECTION_721_BASE_URI, registry.address],
        {
            kind: "uups",
        }
    );
    await erc721.deployed();

    console.log("LabelCollection 721: " + erc721.address);

    PFP = await ethers.getContractFactory("LabelPFP");
    pfp = await upgrades.deployProxy(
        PFP,
        [
            LABEL_PFP_BASE_URI,
            PFP_SUPPLY_CAP,
            PFP_CREATORS,
            PFP_ROYALTIES,
            PFP_TOTAL_ROYALTIES,
        ],
        {
            kind: "uups",
        }
    );
    await pfp.deployed();

    console.log("PFP Collection: " + pfp.address);

    Headphone = await ethers.getContractFactory("LabelHeadphone");
    hp = await upgrades.deployProxy(
        Headphone,
        [
            LABEL_HEADPHONE_BASE_URI,
            HP_SUPPLY_CAP,
            HP_CREATORS,
            HP_ROYALTIES,
            HP_TOTAL_ROYALTIES,
        ],
        {
            kind: "uups",
        }
    );
    await hp.deployed();

    console.log("Headphone Collection: " + hp.address);

    platformFeeRecipient = FEE_RECEIVER;
    platformFee = PLATFORM_FEE; // 2.5%

    PaymentManager = await ethers.getContractFactory("PaymentManager");
    payment = await upgrades.deployProxy(
        PaymentManager,
        [
            [
                ip.address,
                a721.address,
                a1155.address,
                erc1155.address,
                erc721.address,
                pfp.address,
                hp.address,
            ],
            platformFeeRecipient,
            platformFee,
        ],
        {
            kind: "uups",
        }
    );
    await payment.deployed();

    console.log("PaymentManager: " + payment.address);

    StaticMarket = await ethers.getContractFactory("LabelStaticMarket");
    let statici = await StaticMarket.deploy();
    await statici.deployed();

    console.log("StaticMarket: " + statici.address);

    MM = await ethers.getContractFactory("MatchingMachine");
    mm = await MM.deploy(exchange.address);
    await mm.deployed();

    console.log("Matching machine: " + mm.address);

    MintingMachine = await ethers.getContractFactory("MintingMachine");
    mintingMachine = await MintingMachine.deploy([
        ip.address,
        a721.address,
        a1155.address,
        erc1155.address,
        erc721.address,
    ]);
    await mintingMachine.deployed();

    console.log("Minting machine: " + mintingMachine.address);

    console.log("-----------SETTINGS AFTER DEPLOY-----------");

    await registry.grantInitialAuthentication(exchange.address);

    console.log("-----------DONE-----------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
