/* global artifacts:false, it:false, contract:false, assert:false */

// const WyvernAtomicizer = artifacts.require("WyvernAtomicizer");
// const WyvernExchange = artifacts.require("WyvernExchange");
// const StaticMarket = artifacts.require("StaticMarket");
// const WyvernRegistry = artifacts.require("WyvernRegistry");
// const TestERC20 = artifacts.require("TestERC20");
// const TestERC721 = artifacts.require("TestERC721");

const LabelCollectionA = artifacts.require("LabelCollection721");
const PaymentManagerA = artifacts.require("PaymentManager");

const {
    wrap,
    ZERO_BYTES32,
    CHAIN_ID,
    assertIsRejected,
    getPredicateId,
} = require("../common/util");

contract("WyvernExchange", () => {
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

        ERC721 = await ethers.getContractFactory("LabelCollection721");
        erc721 = await upgrades.deployProxy(ERC721, [10000, registry.address], {
            kind: "uups",
        });
        await erc721.deployed();

        PaymentManager = await ethers.getContractFactory("PaymentManager");

        StaticMarket = await ethers.getContractFactory("LabelStaticMarket");

        statici = await StaticMarket.deploy();
        await statici.deployed();

        //settings
        await registry.grantInitialAuthentication(exchange.address);
    });
    const erc721_for_erc20_test = async (options) => {
        let {
            tokenId,
            buyTokenId,
            sellingPrice,
            buyingPrice,
            erc20MintAmount,
            account_a,
            account_b,
            sender,
            creators,
            royalties,
            totalRoyalties,
            platformFeeRecipient,
            platformFee,
        } = options;

        tokenId = getPredicateId(creators[0], tokenId, 1);
        bid = getPredicateId(creators[0], 99, 1);

        let payment = await upgrades.deployProxy(
            PaymentManager,
            [[erc721.address], platformFeeRecipient.address, platformFee],
            {
                kind: "uups",
            }
        );

        await payment.deployed();

        await registry.connect(account_a).registerProxy();
        let proxy1 = await registry.proxies(account_a.address);
        assert.equal(true, proxy1.length > 0, "no proxy address for account a");

        await registry.connect(account_b).registerProxy();
        let proxy2 = await registry.proxies(account_b.address);
        assert.equal(true, proxy2.length > 0, "no proxy address for account b");

        await Promise.all([
            erc721.connect(account_a).setApprovalForAll(proxy1, true),
            erc20.connect(account_b).approve(payment.address, erc20MintAmount),
        ]);
        await Promise.all([
            erc721.mint(
                account_a.address,
                tokenId,
                "/abc",
                creators,
                royalties,
                totalRoyalties
            ),
            erc20.mint(account_b.address, erc20MintAmount),
        ]);

        if (buyTokenId)
            await erc721.mint(
                account_a.address,
                bid,
                "/abc",
                creators,
                royalties,
                totalRoyalties
            );

        const erc721c = new web3.eth.Contract(
            LabelCollectionA.abi,
            erc721.address
        );
        // const erc20c = new web3.eth.Contract(erc20.abi, erc20.address);
        const paymentc = new web3.eth.Contract(
            PaymentManagerA.abi,
            payment.address
        );

        const selectorOne = web3.eth.abi.encodeFunctionSignature(
            "ERC721ForERC20SplitFeeDirect(bytes,address[7],uint8[2],uint256[6],bytes,bytes)"
        );
        const selectorTwo = web3.eth.abi.encodeFunctionSignature(
            "ERC20ForERC721SplitFeeDirect(bytes,address[7],uint8[2],uint256[6],bytes,bytes)"
        );

        const paramsOne = web3.eth.abi.encodeParameters(
            ["address[2]", "address", "uint256[2]", "string"],
            [
                [erc721.address, erc20.address],
                payment.address,
                [tokenId, sellingPrice],
                "1",
            ]
        );

        const paramsTwo = web3.eth.abi.encodeParameters(
            ["address[2]", "address", "uint256[2]", "string"],
            [
                [erc20.address, erc721.address],
                payment.address,
                [buyTokenId ? bid : tokenId, buyingPrice],
                "1",
            ]
        );
        const one = {
            registry: registry.address,
            maker: account_a.address,
            staticTarget: statici.address,
            staticSelector: selectorOne,
            staticExtradata: paramsOne,
            maximumFill: 1,
            listingTime: "0",
            expirationTime: "10000000000",
            salt: "11",
        };
        const two = {
            registry: registry.address,
            maker: account_b.address,
            staticTarget: statici.address,
            staticSelector: selectorTwo,
            staticExtradata: paramsTwo,
            maximumFill: 1,
            listingTime: "0",
            expirationTime: "10000000000",
            salt: "12",
        };

        const firstData = erc721c.methods
            .transferFrom(account_a.address, account_b.address, tokenId)
            .encodeABI();

        const secondData = paymentc.methods
            .payForNFT(
                account_b.address,
                account_a.address,
                buyingPrice,
                erc20.address,
                erc721.address,
                tokenId,
                "1"
            )
            .encodeABI();

        const firstCall = {
            target: erc721.address,
            howToCall: 0,
            data: firstData,
        };
        const secondCall = {
            target: payment.address,
            howToCall: 0,
            data: secondData,
        };

        let sigOne = await exchange.sign(one, account_a.address);
        let sigTwo = await exchange.sign(two, account_b.address);

        await exchange.atomicMatchWith(
            one,
            sigOne,
            firstCall,
            two,
            sigTwo,
            secondCall,
            ZERO_BYTES32
        );

        receiveAmount =
            sellingPrice * (1 - (platformFee + totalRoyalties) / 10000);

        let [account_a_erc20_balance, token_owner] = await Promise.all([
            erc20.balanceOf(account_a.address),
            erc721.ownerOf(tokenId),
        ]);
        assert.equal(
            account_a_erc20_balance.toNumber(),
            receiveAmount,
            "Incorrect ERC20 balance"
        );
        assert.equal(token_owner, account_b.address, "Incorrect token owner");
    };

    it("StaticMarket: matches erc721 <> erc20 order", async () => {
        const price = 15000;

        return erc721_for_erc20_test({
            tokenId: 10,
            sellingPrice: price,
            buyingPrice: price,
            erc20MintAmount: price,
            account_a: accounts[5],
            account_b: accounts[6],
            sender: accounts[1],
            creators: [accounts[2].address, accounts[3].address],
            royalties: [6000, 4000],
            totalRoyalties: 500,
            platformFeeRecipient: accounts[4],
            platformFee: 100,
        });
    });

    it("StaticMarket: does not fill erc721 <> erc20 order with different prices", async () => {
        const price = 15000;

        return assertIsRejected(
            erc721_for_erc20_test({
                tokenId: 10,
                sellingPrice: price,
                buyingPrice: price - 1,
                erc20MintAmount: price,
                account_a: accounts[0],
                account_b: accounts[6],
                sender: accounts[1],
                creators: [accounts[2].address, accounts[3].address],
                royalties: [6000, 4000],
                totalRoyalties: 500,
                platformFeeRecipient: accounts[4],
                platformFee: 100,
            }),
            /Static call failed/,
            "Order should not have matched"
        );
    });

    it("StaticMarket: does not fill erc721 <> erc20 order if the balance is insufficient", async () => {
        const price = 15000;

        return assertIsRejected(
            erc721_for_erc20_test({
                tokenId: 10,
                sellingPrice: price,
                buyingPrice: price,
                erc20MintAmount: price - 1,
                account_a: accounts[0],
                account_b: accounts[6],
                sender: accounts[1],
                creators: [accounts[2].address, accounts[3].address],
                royalties: [6000, 4000],
                totalRoyalties: 500,
                platformFeeRecipient: accounts[4],
                platformFee: 100,
            }),
            /Second call failed/,
            "Order should not have matched"
        );
    });

    it("StaticMarket: does not fill erc721 <> erc20 order if the token IDs are different", async () => {
        const price = 15000;

        return assertIsRejected(
            erc721_for_erc20_test({
                tokenId: 10,
                buyTokenId: 11,
                sellingPrice: price,
                buyingPrice: price,
                erc20MintAmount: price,
                account_a: accounts[0],
                account_b: accounts[6],
                creators: [accounts[2].address, accounts[3].address],
                royalties: [6000, 4000],
                totalRoyalties: 500,
                platformFeeRecipient: accounts[4],
                platformFee: 100,
            }),
            /Static call failed/,
            "Order should not have matched"
        );
    });
});
