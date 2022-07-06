const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const {
    wrap,
    ZERO_BYTES32,
    CHAIN_ID,
    assertIsRejected,
    getPredicateId,
    ZERO_ADDRESS,
} = require("../common/util");

describe("Payment Manager", function () {
    beforeEach(async () => {
        accounts = await ethers.getSigners();

        Registry = await ethers.getContractFactory("WyvernRegistry");
        registry = await Registry.deploy();
        await registry.deployed();

        Exchange = await ethers.getContractFactory("WyvernExchange");
        ex = await Exchange.deploy(CHAIN_ID, [registry.address], "0x");
        await ex.deployed();
        exchange = wrap(ex);

        ERC20 = await ethers.getContractFactory("MockLabel");
        erc20 = await ERC20.deploy();
        await erc20.deployed();

        ERC1155 = await ethers.getContractFactory("LabelCollection1155");
        erc1155 = await upgrades.deployProxy(
            ERC1155,
            ["/test", registry.address],
            {
                kind: "uups",
            }
        );
        await erc1155.deployed();

        PaymentManager = await ethers.getContractFactory("PaymentManager");
        StaticMarket = await ethers.getContractFactory("LabelStaticMarket");

        statici = await StaticMarket.deploy();
        await statici.deployed();

        //settings
        await registry.grantInitialAuthentication(exchange.address);
    });

    const test = async (options) => {
        const {
            tokenId,
            buyTokenId,
            sellAmount,
            sellingPrice,
            sellingNumerator,
            buyingPrice,
            buyAmount,
            buyingDenominator,
            erc1155MintAmount,
            erc20MintAmount,
            account_a,
            account_b,
            sender,
            transactions,
            creators,
            royalties,
            totalRoyalties,
            platformFeeRecipient,
            platformFee,
            moneyReceiver,
        } = options;

        const mr = moneyReceiver || account_a;

        let payment = await upgrades.deployProxy(
            PaymentManager,
            [erc1155.address, platformFeeRecipient, platformFee],
            {
                kind: "uups",
            }
        );

        await payment.deployed();

        await upgrades.upgradeProxy(payment.address, PaymentManager, {
            kind: "uups",
        });

        await payment.payForNFT(account_b.address, mr, 0, erc20.address, 10);

        await erc20.mint(accounts[0].address, 1000000000000);
        await erc20
            .connect(accounts[0])
            .approve(payment.address, 1000000000000);
        await payment.setLabelCollection(erc20.address);
        await payment.setPlatformFee(platformFee);
        await payment.setPlatformFeeRecipient(accounts[2].address);
        expect(payment.setLabelCollection(ZERO_ADDRESS)).to.be.revertedWith(
            "invalid address"
        );
        expect(
            payment.setPlatformFeeRecipient(ZERO_ADDRESS)
        ).to.be.revertedWith("invalid address");
        await expect(
            payment.multiTransfer(
                erc20.address,
                [accounts[1].address, accounts[2].address],
                [10]
            )
        ).to.be.revertedWith("invalid amounts");

        await erc20.approve(payment.address, 1000000000000);
        await payment.pause();
        await expect(
            payment.multiTransfer(erc20.address, [accounts[1].address], [1])
        ).to.be.revertedWith("Pausable: paused");
        await payment.unpause();
        await payment.multiTransfer(erc20.address, [accounts[1].address], [0]);
        expect(
            (await erc20.balanceOf(accounts[1].address)).toNumber()
        ).to.equal(0);
    };

    it("Payment Manager Flow Test", async () => {
        const price = 10000;

        return test({
            tokenId: 5,
            sellAmount: 1,
            sellingPrice: price,
            buyingPrice: price,
            buyAmount: 1,
            erc1155MintAmount: 1,
            erc20MintAmount: price,
            account_a: accounts[1],
            account_b: accounts[6],
            sender: accounts[6],
            creators: [accounts[2].address, accounts[3].address],
            royalties: [6000, 4000],
            totalRoyalties: 500,
            platformFeeRecipient: accounts[5].address,
            platformFee: 150,
            moneyReceiver: accounts[1].address,
        });
    });
});
