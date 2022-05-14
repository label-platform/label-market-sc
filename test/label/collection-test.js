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

        Label1155 = await ethers.getContractFactory("LabelCollection");
        label1155 = await upgrades.deployProxy(
            Label1155,
            ["/test", registry.address],
            {
                kind: "uups",
            }
        );
        await label1155.deployed();
    });

    it("Should return the owner", async function () {
        expect(await label1155.owner()).to.equal(owner.address);
    });

    it("Should upgrade", async function () {
        await upgrades.upgradeProxy(label1155.address, Label1155, {
            kind: "uups",
        });
    });

    it("Mint", async function () {
        const predicatedId = getPredicateId(owner.address, 0, 100);

        await label1155.mint(
            [addr1.address, addr2.address, owner.address], // account
            [10, 20, 30], // amount
            100,
            predicatedId,
            "/abc",
            [owner.address, addr2.address, addr3.address],
            [6000, 2000, 2000],
            500,
            "0x"
        );
        await expect(
            label1155.mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20, 30], // amount
                100,
                predicatedId,
                "/abc",
                [owner.address, addr2.address, addr3.address],
                [6000, 2000, 2000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Token existed");
        expect(
            parseInt(await label1155.balanceOf(owner.address, predicatedId))
        ).to.be.equal(70);
        expect(
            parseInt(await label1155.balanceOf(addr1.address, predicatedId))
        ).to.be.equal(10);
        expect(
            parseInt(await label1155.balanceOf(addr2.address, predicatedId))
        ).to.be.equal(20);

        [creators, royalties, totalroyalties] = await label1155.getCreditsInfo(
            predicatedId
        );

        expect(creators[0]).to.be.equal(owner.address);
        expect(royalties[0].toNumber()).to.be.equal(6000);
        expect(royalties[1].toNumber()).to.be.equal(2000);
        expect(royalties[2].toNumber()).to.be.equal(2000);
        expect(totalroyalties.toNumber()).to.be.equal(500);
        expect(await label1155.tokenUri(predicatedId)).to.be.equal("/test/abc");

        expect(await label1155.getTokenIndexById(predicatedId)).to.be.equal(
            "0"
        );

        expect(await label1155.getTokenMaxSupplyById(predicatedId)).to.be.equal(
            "100"
        );
        expect(await label1155.isApprovedForAll(owner.address, owner.address))
            .to.be.false;
        expect(await label1155.isApprovedForAll(owner.address, addr2.address))
            .to.be.false;
        expect(await label1155.getTokenCreatorById(predicatedId)).to.be.equal(
            owner.address
        );
        await label1155.setURI("");
        await label1155.setMinterRole(
            [owner.address, addr2.address, addr3.address],
            1
        );
    });
    it("Mint revert", async function () {
        const predicatedId = getPredicateId(owner.address, 0, 100);
        await expect(
            label1155.mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20], // amount
                100,
                predicatedId,
                "/abc",
                [owner.address, addr2.address, addr3.address],
                [6000, 2000, 2000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Invalid accounts");
        await expect(label1155.mint(
            [addr1.address, addr2.address, owner.address], // acount
            [10, 20, 30], // amount
            100,
            predicatedId,
            "/abc",
            [owner.address, addr2.address, addr3.address],
            [6010, 2000, 2000],
            500,
            "0x"
        )).to.be.revertedWith("Invalid royalties");
        await expect(
            label1155.mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20, 30], // amount
                100,
                1,
                "/abc",
                [addr1.address, addr2.address, addr3.address],
                [6000, 2000, 2000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Invalid ID and creator");
        await expect(
            label1155.mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20, 30], // amount
                100,
                predicatedId,
                "/abc",
                [owner.address],
                [6000, 2000, 2000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Invalid creators");

        await expect(
            label1155.connect(addr2).mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20, 30], // amount
                100,
                predicatedId,
                "/abc",
                [owner.address],
                [6000, 2000, 2000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Not minter");

        await expect(
            label1155.mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20, 30], // amount
                100,
                predicatedId,
                "/abc",
                [owner.address, addr2.address, addr3.address],
                [6000, 2000, 1000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Invalid royalties");

        await label1155.pause();
        await expect(
            label1155.mint(
                [addr1.address, addr2.address, owner.address], // account
                [10, 20, 30], // amount
                100,
                predicatedId,
                "/abc",
                [owner.address, addr2.address, addr3.address],
                [6000, 2000, 2000],
                500,
                "0x"
            )
        ).to.be.revertedWith("Pausable: paused");
        await label1155.unpause();
        await label1155.mint(
            [addr1.address, addr2.address, owner.address], // account
            [10, 20, 30], // amount
            100,
            predicatedId,
            "/abc",
            [owner.address, addr2.address, addr3.address],
            [6000, 2000, 2000],
            500,
            "0x"
        );
    });

    it("safeMultiTransferFrom", async function () {
        const predicatedId = getPredicateId(owner.address, 0, 100);

        await label1155.mint(
            [owner.address], // account
            [100], // amount
            100,
            predicatedId,
            "/abc",
            [owner.address],
            [10000],
            500,
            "0x"
        );

        const predicatedId1 = getPredicateId(owner.address, 1, 100);

        await label1155.mint(
            [owner.address], // account
            [100], // amount
            100,
            predicatedId1,
            "/abc",
            [owner.address],
            [10000],
            500,
            "0x"
        );

        await label1155.safeMultiTransferFrom(
            owner.address,
            [addr1.address, addr2.address],
            [predicatedId, predicatedId1],
            [100, 100],
            "0x"
        );

        await expect(
            label1155
                .connect(addr1)
                .safeMultiTransferFrom(
                    owner.address,
                    [addr1.address, addr2.address],
                    [predicatedId, predicatedId1],
                    [100, 100],
                    "0x"
                )
        ).to.be.reverted;

        expect(
            (await label1155.balanceOf(addr1.address, predicatedId)).toNumber()
        ).to.equal(100);

        expect(
            (await label1155.balanceOf(addr2.address, predicatedId1)).toNumber()
        ).to.equal(100);
    });
});
