const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const { getPredicateId, encode721MintingCall } = require("../common/util");

const ABI721 =
    require("../../artifacts/contracts/label/LabelCollection721.sol/LabelCollection721.json").abi;

const ABI1155 =
    require("../../artifacts/contracts/label/LabelCollection1155.sol/LabelCollection1155.json").abi;

describe("Minting machine", function () {
    let owner, Label1155, label1155;
    beforeEach(async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        Registry = await ethers.getContractFactory("WyvernRegistry");
        registry = await Registry.deploy();
        await registry.deployed();

        Label721 = await ethers.getContractFactory("LabelCollection721");
        label721 = await upgrades.deployProxy(
            Label721,
            ["/", registry.address],
            {
                kind: "uups",
            }
        );
        await label721.deployed();

        Label1155 = await ethers.getContractFactory("LabelCollection1155");
        label1155 = await upgrades.deployProxy(
            Label1155,
            ["/test", registry.address],
            {
                kind: "uups",
            }
        );
        await label1155.deployed();

        MintingMachine = await ethers.getContractFactory("MintingMachine");
        mm = await MintingMachine.deploy([label721.address, label1155.address]);
        await mm.deployed();

        await label721.setMinterRole([mm.address], true);
        await label1155.setMinterRole([mm.address], true);
    });

    it("BULK", async function () {
        const i1155 = new ethers.utils.Interface(ABI1155);
        const i721 = new ethers.utils.Interface(ABI721);

        const predicatedId1155 = getPredicateId(owner.address, 0, 100);
        const predicatedId721 = getPredicateId(owner.address, 0, 1);

        const data1155 = i1155.encodeFunctionData("mint", [
            [addr1.address, addr2.address, owner.address], // account
            [10, 20, 30], // amount
            100,
            predicatedId1155,
            "/abc",
            [owner.address, addr2.address, addr3.address],
            [6000, 2000, 2000],
            500,
            "0x",
        ]);

        const data721 = i721.encodeFunctionData("mint", [
            addr1.address,
            predicatedId721,
            "/abc",
            [owner.address, addr2.address, addr3.address],
            [6000, 2000, 2000],
            500,
        ]);

        await mm.batchMint(
            1,
            [label721.address, label1155.address],
            [data721, data1155]
        );

        expect(await label721.ownerOf(predicatedId721)).to.equal(addr1.address);
        expect(
            (
                await label1155.balanceOf(addr1.address, predicatedId1155)
            ).toNumber()
        ).to.equal(10);
    });
});
