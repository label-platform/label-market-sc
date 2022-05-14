const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const LabelCollectionA = artifacts.require("LabelCollection");
const PaymentManagerA = artifacts.require("PaymentManager");

const {
    wrap,
    ZERO_BYTES32,
    CHAIN_ID,
    assertIsRejected,
    getPredicateId,
    encodeMatchingCall,
} = require("../common/util");

describe("Exchange Direct", function () {
    beforeEach(async () => {
        accounts = await ethers.getSigners();

        Registry = await ethers.getContractFactory("WyvernRegistry");
        registry = await Registry.deploy();
        await registry.deployed();

        Exchange = await ethers.getContractFactory("WyvernExchange");
        ex = await Exchange.deploy(CHAIN_ID, [registry.address], "0x");
        await ex.deployed();
        exchange = wrap(ex);

        MatchingMachine = await ethers.getContractFactory("MatchingMachine");
        matchingMachine = await MatchingMachine.deploy(ex.address);
        await matchingMachine.deployed();

        ERC20 = await ethers.getContractFactory("MockLabel");
        erc20 = await ERC20.deploy();
        await erc20.deployed();

        ERC1155 = await ethers.getContractFactory("LabelCollection");
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
        } = options;

        id = getPredicateId(creators[0], tokenId, erc1155MintAmount);
        bid = getPredicateId(
            creators[0],
            buyTokenId || 686868686,
            erc1155MintAmount
        );

        const txCount = transactions || 1;

        const mr = account_a.address;

        let payment = await upgrades.deployProxy(
            PaymentManager,
            [erc1155.address, platformFeeRecipient, platformFee],
            {
                kind: "uups",
            }
        );

        await payment.deployed();

        await registry.connect(account_a).registerProxy();
        let proxy1 = await registry
            .connect(account_a)
            .proxies(account_a.address);
        assert.equal(true, proxy1.length > 0, "no proxy address for account a");

        await registry.connect(account_b).registerProxy();
        let proxy2 = await registry
            .connect(account_b)
            .proxies(account_b.address);
        assert.equal(true, proxy2.length > 0, "no proxy address for account b");

        await Promise.all([
            //   erc1155.setApprovalForAll(proxy1, true, { from: account_a }),
            //   erc20.approve(proxy2, erc20MintAmount, { from: account_b }),
            erc20.connect(account_b).approve(payment.address, erc20MintAmount),
        ]);
        await Promise.all([
            erc1155.mint(
                [account_a.address],
                [erc1155MintAmount],
                erc1155MintAmount,
                id,
                "/test",
                creators,
                royalties,
                totalRoyalties,
                "0x"
            ),
            erc20.mint(account_b.address, erc20MintAmount),
        ]);

        if (buyTokenId)
            await erc1155.mint(
                [account_a.address],
                [erc1155MintAmount],
                erc1155MintAmount,
                bid,
                "/test",
                creators,
                royalties,
                totalRoyalties,
                "0x"
            );

        const erc1155c = new web3.eth.Contract(
            LabelCollectionA.abi,
            erc1155.address
        );
        // const erc20c = new web3.eth.Contract(erc20.abi, erc20.address);
        const paymentc = new web3.eth.Contract(
            PaymentManagerA.abi,
            payment.address
        );

        const selectorOne = web3.eth.abi.encodeFunctionSignature(
            "anyERC1155ForERC20SplitFeeDirect(bytes,address[7],uint8[2],uint256[6],bytes,bytes)"
        );
        const selectorTwo = web3.eth.abi.encodeFunctionSignature(
            "anyERC20ForERC1155SplitFeeDirect(bytes,address[7],uint8[2],uint256[6],bytes,bytes)"
        );

        const paramsOne = web3.eth.abi.encodeParameters(
            ["address[2]", "address", "uint256[3]"],
            [
                [erc1155.address, erc20.address],
                payment.address,
                [id, sellingNumerator || 1, sellingPrice],
            ]
        );

        const paramsTwo = web3.eth.abi.encodeParameters(
            ["address[2]", "address", "uint256[3]"],
            [
                [erc20.address, erc1155.address],
                payment.address,
                [buyTokenId ? bid : id, buyingPrice, buyingDenominator || 1],
            ]
        );

        const one = {
            registry: registry.address,
            maker: account_a.address,
            staticTarget: statici.address,
            staticSelector: selectorOne,
            staticExtradata: paramsOne,
            maximumFill: (sellingNumerator || 1) * sellAmount,
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
            maximumFill: buyingPrice * buyAmount,
            listingTime: "0",
            expirationTime: "10000000000",
            salt: "12",
        };

        const firstData =
            erc1155c.methods
                .safeTransferFrom(
                    account_a.address,
                    account_b.address,
                    id,
                    sellingNumerator || buyAmount,
                    "0x"
                )
                .encodeABI() + ZERO_BYTES32.substr(2);

        const secondData = paymentc.methods
            .payForNFT(
                account_b.address,
                mr,
                buyAmount * buyingPrice,
                erc20.address,
                id
            )
            .encodeABI();

        const firstCall = {
            target: erc1155.address,
            howToCall: 0,
            data: firstData,
        };
        const secondCall = {
            target: payment.address,
            howToCall: 0,
            data: secondData,
        };

        let sigOne = await exchange.sign(one, account_a.address);

        if (txCount > 1) {
            let matchingData = [];

            for (var i = 0; i < txCount; ++i) {
                let sigTwo = await exchange.sign(two, account_b.address);

                data = await encodeMatchingCall(
                    one,
                    sigOne,
                    firstCall,
                    two,
                    sigTwo,
                    secondCall
                );
                matchingData.push(data);
                two.salt++;
            }

            await expect(matchingMachine.multiMatch(1, matchingData))
                .to.emit(matchingMachine, "MultiMatched")
                .withArgs(1, Array(txCount).fill(true));
        } else {
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
        }

        let [
            mrBalance,
            account_b_erc1155_balance,
            platformFeeRecipientBalance,
        ] = await Promise.all([
            erc20.balanceOf(mr),
            erc1155.balanceOf(account_b.address, id),
            erc20.balanceOf(platformFeeRecipient),
        ]);

        const totalPay = sellingPrice * buyAmount * txCount;
        const royaltyFeeAmount = (totalPay * totalRoyalties) / 10000;
        const platformFeeAmount = (totalPay * platformFee) / 10000;

        for (let i = 0; i < creators.length; i++) {
            feeAmount = await erc20.balanceOf(creators[i]);
            assert.equal(
                feeAmount.toNumber(),
                (royaltyFeeAmount * royalties[i]) / 10000,
                "Incorrect creator's ERC20 balance"
            );
        }

        assert.equal(
            mrBalance.toNumber(),
            totalPay - royaltyFeeAmount - platformFeeAmount,
            "Incorrect money receiver's ERC20 balance"
        );

        assert.equal(
            platformFeeRecipientBalance.toNumber(),
            platformFeeAmount,
            "Incorrect ERC20 balance"
        );

        assert.equal(
            account_b_erc1155_balance.toNumber(),
            sellingNumerator || buyAmount * txCount,
            "Incorrect ERC1155 balance"
        );
    };

    it("StaticMarket: matches erc1155 <> erc20 order, 1 fill", async () => {
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
        });
    });
    it("StaticMarket: matches erc1155 <> erc20 order, 1 fill", async () => {
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
        });
    });

    it("StaticMarket: matches erc1155 <> erc20 order, multiple fills in 1 transaction", async () => {
        const amount = 3;
        const price = 10000;

        return test({
            tokenId: 5,
            sellAmount: amount,
            sellingPrice: price,
            buyingPrice: price,
            buyAmount: amount,
            erc1155MintAmount: amount,
            erc20MintAmount: amount * price,
            account_a: accounts[1],
            account_b: accounts[6],
            sender: accounts[6],
            creators: [accounts[2].address, accounts[3].address],
            royalties: [6000, 4000],
            totalRoyalties: 500,
            platformFeeRecipient: accounts[5].address,
            platformFee: 150,
        });
    });

    it("StaticMarket: matches erc1155 <> erc20 order, multiple fills in multiple transactions", async () => {
        const nftAmount = 100;
        const buyAmount = 10;
        const price = 10000;
        const transactions = 10;

        return test({
            tokenId: 5,
            sellAmount: nftAmount,
            sellingPrice: price,
            buyingPrice: price,
            buyAmount,
            erc1155MintAmount: nftAmount,
            erc20MintAmount: buyAmount * price * transactions,
            account_a: accounts[2],
            account_b: accounts[3],
            sender: accounts[6],
            creators: [accounts[1].address, accounts[6].address],
            royalties: [6000, 4000],
            totalRoyalties: 500,
            platformFeeRecipient: accounts[5].address,
            platformFee: 150,
            transactions,
        });
    });

    it("StaticMarket: matches erc1155 <> erc20 order, allows any partial fill", async () => {
        const nftAmount = 30;
        const buyAmount = 4;
        const price = 10000;

        return test({
            tokenId: 5,
            sellAmount: nftAmount,
            sellingPrice: price,
            buyingPrice: price,
            buyAmount,
            erc1155MintAmount: nftAmount,
            erc20MintAmount: buyAmount * price,
            account_a: accounts[1],
            account_b: accounts[6],
            sender: accounts[6],
            creators: [accounts[2].address, accounts[3].address],
            royalties: [6000, 4000],
            totalRoyalties: 500,
            platformFeeRecipient: accounts[5].address,
            platformFee: 150,
        });
    });

    it("StaticMarket: matches erc1155 <> erc20 order with any matching ratio", async () => {
        const lot = 83974;
        const price = 9720000;

        return test({
            tokenId: 5,
            sellAmount: 6,
            sellingNumerator: lot,
            sellingPrice: price,
            buyingPrice: price,
            buyingDenominator: lot,
            buyAmount: 1,
            erc1155MintAmount: lot,
            erc20MintAmount: price,
            account_a: accounts[1],
            account_b: accounts[6],
            sender: accounts[6],
            creators: [accounts[2].address, accounts[3].address],
            royalties: [6000, 4000],
            totalRoyalties: 500,
            platformFeeRecipient: accounts[5].address,
            platformFee: 150,
        });
    });

    it("StaticMarket: does not match erc1155 <> erc20 order beyond maximum fill", async () => {
        const price = 10000;

        return assertIsRejected(
            test({
                tokenId: 5,
                sellAmount: 1,
                sellingPrice: price,
                buyingPrice: price,
                buyAmount: 1,
                erc1155MintAmount: 2,
                erc20MintAmount: price * 2,
                transactions: 2,
                account_a: accounts[1],
                account_b: accounts[6],
                sender: accounts[6],
                creators: [accounts[2].address, accounts[3].address],
                royalties: [6000, 4000],
                totalRoyalties: 500,
                platformFeeRecipient: accounts[5].address,
                platformFee: 150,
            }),

            "expected false to equal true"
        );
    });

    it("StaticMarket: does not fill erc1155 <> erc20 order with different prices", async () => {
        const price = 10000;

        return assertIsRejected(
            test({
                tokenId: 5,
                sellAmount: 1,
                sellingPrice: price,
                buyingPrice: price - 10,
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
            }),
            /Static call failed/,
            "Order should not match."
        );
    });

    it("StaticMarket: does not fill erc1155 <> erc20 order with different ratios", async () => {
        const price = 10000;

        return assertIsRejected(
            test({
                tokenId: 5,
                sellAmount: 1,
                sellingPrice: price,
                buyingPrice: price,
                buyingDenominator: 2,
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
            }),
            /Static call failed/,
            "Order should not match."
        );
    });

    it("StaticMarket: does not fill erc1155 <> erc20 order beyond maximum sell amount", async () => {
        const nftAmount = 2;
        const buyAmount = 3;
        const price = 10000;

        return assertIsRejected(
            test({
                tokenId: 5,
                sellAmount: nftAmount,
                sellingPrice: price,
                buyingPrice: price,
                buyAmount,
                erc1155MintAmount: nftAmount,
                erc20MintAmount: buyAmount * price,
                account_a: accounts[1],
                account_b: accounts[6],
                sender: accounts[6],
                creators: [accounts[2].address, accounts[3].address],
                royalties: [6000, 4000],
                totalRoyalties: 500,
                platformFeeRecipient: accounts[5].address,
                platformFee: 150,
            }),
            /First call failed/,
            "Order should not fill"
        );
    });

    it("StaticMarket: does not fill erc1155 <> erc20 order if balance is insufficient", async () => {
        const nftAmount = 1;
        const buyAmount = 1;
        const price = 10000;

        return assertIsRejected(
            test({
                tokenId: 5,
                sellAmount: nftAmount,
                sellingPrice: price,
                buyingPrice: price,
                buyAmount,
                erc1155MintAmount: nftAmount,
                erc20MintAmount: buyAmount * price - 1,
                account_a: accounts[1],
                account_b: accounts[6],
                sender: accounts[6],
                creators: [accounts[2].address, accounts[3].address],
                royalties: [6000, 4000],
                totalRoyalties: 500,
                platformFeeRecipient: accounts[5].address,
                platformFee: 150,
            }),
            /Second call failed/,
            "Order should not fill"
        );
    });

    it("StaticMarket: does not fill erc1155 <> erc20 order if the token IDs are different", async () => {
        const price = 10000;

        return assertIsRejected(
            test({
                tokenId: 5,
                buyTokenId: 6,
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
            }),
            /Static call failed/,
            "Order should not match the second time."
        );
    });
});
