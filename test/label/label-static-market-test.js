const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { ZERO_ADDRESS, ZERO_BYTES32 } = require("../common/util");

const LabelCollectionA = artifacts.require("LabelCollection");
const PaymentManagerA = artifacts.require("PaymentManager");

describe("Static market", function () {
    beforeEach(async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        Registry = await ethers.getContractFactory("WyvernRegistry");
        registry = await Registry.deploy();
        await registry.deployed();

        ERC1155 = await ethers.getContractFactory("LabelCollection");
        erc1155 = await upgrades.deployProxy(
            ERC1155,
            ["/test", registry.address],
            {
                kind: "uups",
            }
        );
        await erc1155.deployed();

        Static = await ethers.getContractFactory("LabelStaticMarket");
        static = await Static.deploy();
        await static.deployed();

        PaymentManager = await ethers.getContractFactory("PaymentManager");
        payment = await upgrades.deployProxy(
            PaymentManager,
            [erc1155.address, owner.address, 100],
            {
                kind: "uups",
            }
        );

        await payment.deployed();

        erc1155c = new web3.eth.Contract(LabelCollectionA.abi, erc1155.address);
        paymentc = new web3.eth.Contract(PaymentManagerA.abi, payment.address);
    });

    const generateParams = ({
        extra,
        addresses,
        howToCalls,
        uints,
        data,
        counterdata,
    }) => ({
        extra: extra || "0x",
        addresses: addresses || [
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
        ],
        howToCalls: howToCalls || [0, 0],
        uints: uints || [0, 0, 0, 0, 0, 0],
        data: data || "0x",
        counterdata: counterdata || "0x",
    });

    const generateExtraData = ({ a1, a2, u3 }) => {
        addresses1 = a1 || [ZERO_ADDRESS, ZERO_ADDRESS];
        addresses2 = a2 || [ZERO_ADDRESS, ZERO_ADDRESS];
        uints3 = u3 || [0, 0, 0];

        return web3.eth.abi.encodeParameters(
            ["address[2]", "address[2]", "uint256[3]"],
            [
                [addresses1[0], addresses1[1]],
                [addresses2[0], addresses2[1]],
                [uints3[0], uints3[1], uints3[2]],
            ]
        );
    };

    const generateExtraDataDirect = ({ a1, a2, u3 }) => {
        addresses1 = a1 || [ZERO_ADDRESS, ZERO_ADDRESS];
        addresses2 = a2 || ZERO_ADDRESS;
        uints3 = u3 || [0, 0, 0];

        return web3.eth.abi.encodeParameters(
            ["address[2]", "address", "uint256[3]"],
            [
                [addresses1[0], addresses1[1]],
                addresses2,
                [uints3[0], uints3[1], uints3[2]],
            ]
        );
    };

    const generateCallData = (buyAmount) =>
        erc1155c.methods
            .safeTransferFrom(addr1.address, addr2.address, 10, buyAmount, "0x")
            .encodeABI() + ZERO_BYTES32.substr(2);

    const generateCounterCallData = (buyAmount, buyingPrice) =>
        paymentc.methods
            .payForNFT(
                addr2.address,
                addr1.address,
                buyAmount * buyingPrice,
                ZERO_ADDRESS,
                10
            )
            .encodeABI();

    it("Static call sell order check", async function () {
        params1 = generateParams({ uints: [1, 0, 0, 0, 0, 0] });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params1.extra,
                params1.addresses,
                params1.howToCalls,
                params1.uints,
                params1.data,
                params1.counterdata
            )
        ).to.be.revertedWith("anyERC1155ForERC20: Zero value required");

        params2 = generateParams({ howToCalls: [1, 0] });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params2.extra,
                params2.addresses,
                params2.howToCalls,
                params2.uints,
                params2.data,
                params2.counterdata
            )
        ).to.be.revertedWith("anyERC1155ForERC20: call must be a direct call");

        params3 = generateParams({ extra: generateExtraData({}) });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params3.extra,
                params3.addresses,
                params3.howToCalls,
                params3.uints,
                params3.data,
                params3.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: numerator must be larger than zero"
        );

        params4 = generateParams({
            extra: generateExtraData({ u3: [0, 1, 0] }),
        });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params4.extra,
                params4.addresses,
                params4.howToCalls,
                params4.uints,
                params4.data,
                params4.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: denominator must be larger than zero"
        );

        params5 = generateParams({
            extra: generateExtraData({ u3: [0, 1, 1] }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params5.extra,
                params5.addresses,
                params5.howToCalls,
                params5.uints,
                params5.data,
                params5.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: call target must equal address of token to give"
        );

        params6 = generateParams({
            extra: generateExtraData({
                u3: [0, 1, 1],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params6.extra,
                params6.addresses,
                params6.howToCalls,
                params6.uints,
                params6.data,
                params6.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: countercall target must equal address of payment manager"
        );

        params7 = generateParams({
            extra: generateExtraData({
                u3: [0, 1, 1],
                a2: [payment.address, ZERO_ADDRESS],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                payment.address,
                ZERO_ADDRESS,
            ],
            uints: [0, 1, 0, 0, 0, 1000],
        });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params7.extra,
                params7.addresses,
                params7.howToCalls,
                params7.uints,
                params7.data,
                params7.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: new fill exceeds maximum fill"
        );

        params8 = generateParams({
            extra: generateExtraData({
                u3: [0, 1, 1],
                a2: [payment.address, payment.address],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                payment.address,
                ZERO_ADDRESS,
            ],
            uints: [0, 10000, 0, 0, 0, 1],
            data: generateCallData(1),
            counterdata: generateCounterCallData(1, 1),
        });

        await expect(
            static.anyERC1155ForERC20SplitFee(
                params8.extra,
                params8.addresses,
                params8.howToCalls,
                params8.uints,
                params8.data,
                params8.counterdata
            )
        ).to.be.reverted;
    });

    it("Static call sell order direct check", async function () {
        params1 = generateParams({ uints: [1, 0, 0, 0, 0, 0] });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params1.extra,
                params1.addresses,
                params1.howToCalls,
                params1.uints,
                params1.data,
                params1.counterdata
            )
        ).to.be.revertedWith("anyERC1155ForERC20: Zero value required");

        params2 = generateParams({ howToCalls: [1, 0] });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params2.extra,
                params2.addresses,
                params2.howToCalls,
                params2.uints,
                params2.data,
                params2.counterdata
            )
        ).to.be.revertedWith("anyERC1155ForERC20: call must be a direct call");

        params3 = generateParams({ extra: generateExtraDataDirect({}) });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params3.extra,
                params3.addresses,
                params3.howToCalls,
                params3.uints,
                params3.data,
                params3.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: numerator must be larger than zero"
        );

        params4 = generateParams({
            extra: generateExtraDataDirect({ u3: [0, 1, 0] }),
        });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params4.extra,
                params4.addresses,
                params4.howToCalls,
                params4.uints,
                params4.data,
                params4.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: denominator must be larger than zero"
        );

        params5 = generateParams({
            extra: generateExtraDataDirect({ u3: [0, 1, 1] }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params5.extra,
                params5.addresses,
                params5.howToCalls,
                params5.uints,
                params5.data,
                params5.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: call target must equal address of token to give"
        );

        params6 = generateParams({
            extra: generateExtraDataDirect({
                u3: [0, 1, 1],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params6.extra,
                params6.addresses,
                params6.howToCalls,
                params6.uints,
                params6.data,
                params6.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: countercall target must equal address of payment manager"
        );

        params7 = generateParams({
            extra: generateExtraDataDirect({
                u3: [0, 1, 1],
                a2: payment.address,
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                payment.address,
                ZERO_ADDRESS,
            ],
            uints: [0, 1, 0, 0, 0, 1000],
        });

        await expect(
            static.anyERC1155ForERC20SplitFeeDirect(
                params7.extra,
                params7.addresses,
                params7.howToCalls,
                params7.uints,
                params7.data,
                params7.counterdata
            )
        ).to.be.revertedWith(
            "anyERC1155ForERC20: new fill exceeds maximum fill"
        );
    });

    it("Static call buy order check", async function () {
        params1 = generateParams({ uints: [1, 0, 0, 0, 0, 0] });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params1.extra,
                params1.addresses,
                params1.howToCalls,
                params1.uints,
                params1.data,
                params1.counterdata
            )
        ).to.be.revertedWith("anyERC20ForERC1155: Zero value required");

        params2 = generateParams({ howToCalls: [1, 0] });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params2.extra,
                params2.addresses,
                params2.howToCalls,
                params2.uints,
                params2.data,
                params2.counterdata
            )
        ).to.be.revertedWith("anyERC20ForERC1155: call must be a direct call");

        params3 = generateParams({ extra: generateExtraData({}) });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params3.extra,
                params3.addresses,
                params3.howToCalls,
                params3.uints,
                params3.data,
                params3.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: numerator must be larger than zero"
        );

        params4 = generateParams({
            extra: generateExtraData({ u3: [0, 1, 0] }),
        });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params4.extra,
                params4.addresses,
                params4.howToCalls,
                params4.uints,
                params4.data,
                params4.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: denominator must be larger than zero"
        );

        params5 = generateParams({
            extra: generateExtraData({ u3: [0, 1, 1] }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params5.extra,
                params5.addresses,
                params5.howToCalls,
                params5.uints,
                params5.data,
                params5.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: call target must equal address of payment manager"
        );

        params6 = generateParams({
            extra: generateExtraData({
                u3: [0, 1, 1],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params6.extra,
                params6.addresses,
                params6.howToCalls,
                params6.uints,
                params6.data,
                params6.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: countercall target must equal address of token to give"
        );

        params7 = generateParams({
            extra: generateExtraData({
                u3: [0, 1, 1],
                a2: [ZERO_ADDRESS, ZERO_ADDRESS],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
            ],
            uints: [0, 1, 0, 0, 0, 1000],
        });

        await expect(
            static.anyERC20ForERC1155SplitFee(
                params7.extra,
                params7.addresses,
                params7.howToCalls,
                params7.uints,
                params7.data,
                params7.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: new fill exceeds maximum fill"
        );
    });

    it("Static call buy order direct check", async function () {
        params1 = generateParams({ uints: [1, 0, 0, 0, 0, 0] });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params1.extra,
                params1.addresses,
                params1.howToCalls,
                params1.uints,
                params1.data,
                params1.counterdata
            )
        ).to.be.revertedWith("anyERC20ForERC1155: Zero value required");

        params2 = generateParams({ howToCalls: [1, 0] });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params2.extra,
                params2.addresses,
                params2.howToCalls,
                params2.uints,
                params2.data,
                params2.counterdata
            )
        ).to.be.revertedWith("anyERC20ForERC1155: call must be a direct call");

        params3 = generateParams({ extra: generateExtraDataDirect({}) });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params3.extra,
                params3.addresses,
                params3.howToCalls,
                params3.uints,
                params3.data,
                params3.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: numerator must be larger than zero"
        );

        params4 = generateParams({
            extra: generateExtraDataDirect({ u3: [0, 1, 0] }),
        });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params4.extra,
                params4.addresses,
                params4.howToCalls,
                params4.uints,
                params4.data,
                params4.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: denominator must be larger than zero"
        );

        params5 = generateParams({
            extra: generateExtraDataDirect({ u3: [0, 1, 1] }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params5.extra,
                params5.addresses,
                params5.howToCalls,
                params5.uints,
                params5.data,
                params5.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: call target must equal address of payment manager"
        );

        params6 = generateParams({
            extra: generateExtraDataDirect({
                u3: [0, 1, 1],
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                owner.address,
                ZERO_ADDRESS,
            ],
        });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params6.extra,
                params6.addresses,
                params6.howToCalls,
                params6.uints,
                params6.data,
                params6.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: countercall target must equal address of token to give"
        );

        params7 = generateParams({
            extra: generateExtraDataDirect({
                u3: [0, 1, 1],
                a2: ZERO_ADDRESS,
            }),
            addresses: [
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
                ZERO_ADDRESS,
            ],
            uints: [0, 1, 0, 0, 0, 1000],
        });

        await expect(
            static.anyERC20ForERC1155SplitFeeDirect(
                params7.extra,
                params7.addresses,
                params7.howToCalls,
                params7.uints,
                params7.data,
                params7.counterdata
            )
        ).to.be.revertedWith(
            "anyERC20ForERC1155: new fill exceeds maximum fill"
        );
    });
});
