const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { getPredicateId } = require("../common/util");

describe("Collection", function () {
    let owner, Label1155, label1155;
    beforeEach(async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        Registry = await ethers.getContractFactory("WyvernRegistry");
        registry = await Registry.deploy();
        await registry.deployed();

        PFP = await ethers.getContractFactory("LabelPFP");
        pfp = await upgrades.deployProxy(
            PFP,
            ["abc/", 9999, [owner.address], [10000], 200],
            {
                kind: "uups",
            }
        );
        await pfp.deployed();

        Headset = await ethers.getContractFactory("LabelHeadphone");
        hs = await upgrades.deployProxy(
            Headset,
            ["abc/", 9999, [owner.address], [10000], 200],
            {
                kind: "uups",
            }
        );
        await hs.deployed();
    });

    it("Should change uri", async function () {
        await pfp.mint(owner.address, 1);

        uri = await pfp.tokenURI(0);

        console.log(uri);

        await pfp.upgradeNFT(0, "/test");

        uri = await pfp.tokenURI(0);

        console.log(uri);
    });
});
