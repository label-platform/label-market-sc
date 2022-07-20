const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { getPredicateId } = require("../common/util");

describe("LABEL_MYSTERYBOX_MINT", function () {
    const LABEL_MYSTERYBOX_BASE_URI = 'https://api.tracks.label.community/v1/mysterybox/';
    const MYSTERYBOX_CREATORS = ["0x6d93dF555dE260Caee39b8c1FFC5a8E302c2Ae86"];
    const MYSTERYBOX_ROYALTIES = [10000]; // 10000 = 100% of total royalties
    const MYSTERYBOX_TOTAL_ROYALTIES = 400; // 100 = 1%
    let owner;
    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        MYSTERYBOX = await ethers.getContractFactory("LabelMysteryBox");
        mysterybox = await upgrades.deployProxy(
            MYSTERYBOX,
            [
                LABEL_MYSTERYBOX_BASE_URI,
                MYSTERYBOX_CREATORS,
                MYSTERYBOX_ROYALTIES,
                MYSTERYBOX_TOTAL_ROYALTIES,
            ],
            {
                kind: "uups",
            }
        );
        await mysterybox.deployed();
    });

    it("Should mint 10 mysterybox", async function () {
        for (let i = 1; i < 11; i++) {
            await mysterybox.mint(owner.address, i);
            console.log(i);
        }
    });
});
