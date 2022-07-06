const { eip712Domain, structHash, signHash } = require("./eip712.js");
const { network, ethers } = require("hardhat");

const assertIsRejected = (promise, error_match, message) => {
    let passed = false;
    return promise
        .then(() => {
            passed = true;
            return assert.fail();
        })
        .catch((error) => {
            if (passed)
                return assert.fail(
                    message || "Expected promise to be rejected"
                );
            if (error_match) {
                if (typeof error_match === "string")
                    return assert.equal(error_match, error.message, message);
                if (error_match instanceof RegExp)
                    return (
                        error.message.match(error_match) ||
                        assert.fail(
                            error.message,
                            error_match.toString(),
                            `'${
                                error.message
                            }' does not match ${error_match.toString()}: ${message}`
                        )
                    );
                return assert.instanceOf(error, error_match, message);
            }
        });
};

const increaseTime = (seconds) => {
    return new Promise((resolve) =>
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [seconds],
                id: 0,
            },
            resolve
        )
    );
};

const eip712Order = {
    name: "Order",
    fields: [
        { name: "registry", type: "address" },
        { name: "maker", type: "address" },
        { name: "staticTarget", type: "address" },
        { name: "staticSelector", type: "bytes4" },
        { name: "staticExtradata", type: "bytes" },
        { name: "maximumFill", type: "uint256" },
        { name: "listingTime", type: "uint256" },
        { name: "expirationTime", type: "uint256" },
        { name: "salt", type: "uint256" },
    ],
};

web3 = web3.extend({
    methods: [
        {
            name: "signTypedData",
            call: "eth_signTypedData_v4",
            params: 2,
            inputFormatter: [
                web3.extend.formatters.inputAddressFormatter,
                null,
            ],
        },
    ],
});

const hashOrder = (order) => {
    return (
        "0x" +
        structHash(eip712Order.name, eip712Order.fields, order).toString("hex")
    );
};

const structToSign = (order, exchange) => {
    return {
        name: eip712Order.name,
        fields: eip712Order.fields,
        domain: {
            name: "Wyvern Exchange",
            version: "3.1",
            chainId: CHAIN_ID,
            verifyingContract: exchange,
        },
        data: order,
    };
};

const hashToSign = (order, exchange) => {
    return "0x" + signHash(structToSign(order, exchange)).toString("hex");
};

const parseSig = (bytes) => {
    bytes = bytes.substr(2);
    const r = "0x" + bytes.slice(0, 64);
    const s = "0x" + bytes.slice(64, 128);
    const v = parseInt("0x" + bytes.slice(128, 130), 16);
    return { v, r, s };
};

const wrap = (inst) => {
    var obj = {
        ...inst,
        hashOrder: (order) =>
            inst.hashOrder_.call(
                order.registry,
                order.maker,
                order.staticTarget,
                order.staticSelector,
                order.staticExtradata,
                order.maximumFill,
                order.listingTime,
                order.expirationTime,
                order.salt
            ),
        hashToSign: (order) => {
            return inst.hashOrder_
                .call(
                    order.registry,
                    order.maker,
                    order.staticTarget,
                    order.staticSelector,
                    order.staticExtradata,
                    order.maximumFill,
                    order.listingTime,
                    order.expirationTime,
                    order.salt
                )
                .then((hash) => {
                    return inst.hashToSign_.call(hash);
                });
        },
        validateOrderParameters: (order) =>
            inst.validateOrderParameters_.call(
                order.registry,
                order.maker,
                order.staticTarget,
                order.staticSelector,
                order.staticExtradata,
                order.maximumFill,
                order.listingTime,
                order.expirationTime,
                order.salt
            ),
        validateOrderAuthorization: (hash, maker, sig, misc) =>
            inst.validateOrderAuthorization_.call(
                hash,
                maker,
                web3.eth.abi.encodeParameters(
                    ["uint8", "bytes32", "bytes32"],
                    [sig.v, sig.r, sig.s]
                ) + (sig.suffix || ""),
                misc
            ),
        approveOrderHash: (hash) => inst.approveOrderHash_(hash),
        approveOrder: (order, inclusion, misc) =>
            inst.approveOrder_(
                order.registry,
                order.maker,
                order.staticTarget,
                order.staticSelector,
                order.staticExtradata,
                order.maximumFill,
                order.listingTime,
                order.expirationTime,
                order.salt,
                inclusion,
                misc
            ),
        setOrderFill: (order, fill) =>
            inst.setOrderFill_(hashOrder(order), fill),
        atomicMatch: (
            order,
            sig,
            call,
            counterorder,
            countersig,
            countercall,
            metadata
        ) =>
            inst.atomicMatch_(
                [
                    order.registry,
                    order.maker,
                    order.staticTarget,
                    order.maximumFill,
                    order.listingTime,
                    order.expirationTime,
                    order.salt,
                    call.target,
                    counterorder.registry,
                    counterorder.maker,
                    counterorder.staticTarget,
                    counterorder.maximumFill,
                    counterorder.listingTime,
                    counterorder.expirationTime,
                    counterorder.salt,
                    countercall.target,
                ],
                [order.staticSelector, counterorder.staticSelector],
                order.staticExtradata,
                call.data,
                counterorder.staticExtradata,
                countercall.data,
                [call.howToCall, countercall.howToCall],
                metadata,
                web3.eth.abi.encodeParameters(
                    ["bytes", "bytes"],
                    [
                        web3.eth.abi.encodeParameters(
                            ["uint8", "bytes32", "bytes32"],
                            [sig.v, sig.r, sig.s]
                        ) + (sig.suffix || ""),
                        web3.eth.abi.encodeParameters(
                            ["uint8", "bytes32", "bytes32"],
                            [countersig.v, countersig.r, countersig.s]
                        ) + (countersig.suffix || ""),
                    ]
                )
            ),
        atomicMatchWith: (
            order,
            sig,
            call,
            counterorder,
            countersig,
            countercall,
            metadata,
            misc
        ) =>
            inst.atomicMatch_(
                [
                    order.registry,
                    order.maker,
                    order.staticTarget,
                    order.maximumFill,
                    order.listingTime,
                    order.expirationTime,
                    order.salt,
                    call.target,
                    counterorder.registry,
                    counterorder.maker,
                    counterorder.staticTarget,
                    counterorder.maximumFill,
                    counterorder.listingTime,
                    counterorder.expirationTime,
                    counterorder.salt,
                    countercall.target,
                ],
                [order.staticSelector, counterorder.staticSelector],
                order.staticExtradata,
                call.data,
                counterorder.staticExtradata,
                countercall.data,
                [call.howToCall, countercall.howToCall],
                metadata,
                web3.eth.abi.encodeParameters(
                    ["bytes", "bytes"],
                    [
                        web3.eth.abi.encodeParameters(
                            ["uint8", "bytes32", "bytes32"],
                            [sig.v, sig.r, sig.s]
                        ) + (sig.suffix || ""),
                        web3.eth.abi.encodeParameters(
                            ["uint8", "bytes32", "bytes32"],
                            [countersig.v, countersig.r, countersig.s]
                        ) + (countersig.suffix || ""),
                    ]
                ),
                { ...misc }
            ),
    };
    obj.sign = (order, account) => {
        const str = structToSign(order, inst.address);

        return web3
            .signTypedData(account, {
                types: {
                    EIP712Domain: eip712Domain.fields,
                    Order: eip712Order.fields,
                },
                domain: str.domain,
                primaryType: "Order",
                message: order,
            })
            .then((sigBytes) => {
                const sig = parseSig(sigBytes);
                return sig;
            });
    };
    obj.personalSign = (order, account) => {
        const calculatedHashToSign = hashToSign(order, inst.address);
        return web3.eth.sign(calculatedHashToSign, account).then((sigBytes) => {
            let sig = parseSig(sigBytes);
            sig.v += 27;
            sig.suffix = "03"; // EthSign suffix like 0xProtocol
            return sig;
        });
    };
    return obj;
};
//         address to,
//         uint256 tokenId,
//         string memory uri,
//         address[] memory creators,
//         uint256[] memory royalties,
//         uint256 totalRoyalty
const encode721MintingCall = (
    to,
    tokenId,
    uri,
    creators,
    royalties,
    totalRoyalty
) =>
    web3.eth.abi.encodeFunctionCall(
        {
            inputs: [
                {
                    internalType: "address",
                    name: "to",
                    type: "address",
                },
                {
                    internalType: "uint256",
                    name: "tokenId",
                    type: "uint256",
                },
                {
                    internalType: "string",
                    name: "uri",
                    type: "string",
                },
                {
                    internalType: "address[]",
                    name: "creators",
                    type: "address[]",
                },
                {
                    internalType: "uint256[]",
                    name: "royalties",
                    type: "uint256[]",
                },
                {
                    internalType: "uint256",
                    name: "totalRoyalty",
                    type: "uint256",
                },
            ],
            name: "mint",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        [to, tokenId, uri, creators, royalties, totalRoyalty]
    );

const encode1155MintingCall = () => web3.eth.abi.encodeFunctionCall();

const encodeMatchingCall = (
    order,
    sig,
    call,
    counterorder,
    countersig,
    countercall
) => {
    return web3.eth.abi.encodeFunctionCall(
        {
            name: "atomicMatch_",
            outputs: [],
            stateMutability: "payable",
            type: "function",
            inputs: [
                {
                    internalType: "uint256[16]",
                    name: "uints",
                    type: "uint256[16]",
                },
                {
                    internalType: "bytes4[2]",
                    name: "staticSelectors",
                    type: "bytes4[2]",
                },
                {
                    internalType: "bytes",
                    name: "firstExtradata",
                    type: "bytes",
                },
                {
                    internalType: "bytes",
                    name: "firstCalldata",
                    type: "bytes",
                },
                {
                    internalType: "bytes",
                    name: "secondExtradata",
                    type: "bytes",
                },
                {
                    internalType: "bytes",
                    name: "secondCalldata",
                    type: "bytes",
                },
                {
                    internalType: "uint8[2]",
                    name: "howToCalls",
                    type: "uint8[2]",
                },
                {
                    internalType: "bytes32",
                    name: "metadata",
                    type: "bytes32",
                },
                {
                    internalType: "bytes",
                    name: "signatures",
                    type: "bytes",
                },
            ],
        },
        [
            [
                order.registry,
                order.maker,
                order.staticTarget,
                order.maximumFill,
                order.listingTime,
                order.expirationTime,
                order.salt,
                call.target,
                counterorder.registry,
                counterorder.maker,
                counterorder.staticTarget,
                counterorder.maximumFill,
                counterorder.listingTime,
                counterorder.expirationTime,
                counterorder.salt,
                countercall.target,
            ],
            [order.staticSelector, counterorder.staticSelector],
            order.staticExtradata,
            call.data,
            counterorder.staticExtradata,
            countercall.data,
            [call.howToCall, countercall.howToCall],
            ZERO_BYTES32,
            web3.eth.abi.encodeParameters(
                ["bytes", "bytes"],
                [
                    web3.eth.abi.encodeParameters(
                        ["uint8", "bytes32", "bytes32"],
                        [sig.v, sig.r, sig.s]
                    ) + (sig.suffix || ""),
                    web3.eth.abi.encodeParameters(
                        ["uint8", "bytes32", "bytes32"],
                        [countersig.v, countersig.r, countersig.s]
                    ) + (countersig.suffix || ""),
                ]
            ),
        ]
    );
};

const randomUint = () => {
    return Math.floor(Math.random() * 1e10);
};

const getPredicateId = (creator, index, totalSupply) => {
    /*
      DESIGN NOTES:
      Token ids are a concatenation of:
      * creator: hex address of the creator of the token. 160 bits
      * index: Index for this token (the regular ID), up to 2^56 - 1. 56 bits
      * supply: Supply cap for this token, up to 2^40 - 1 (1 trillion).  40 bits
  */

    //address is 20 bytes => 160 bits

    const indexHex = ethers.utils.hexZeroPad(ethers.utils.hexValue(index), 7); // 7 bytes => 56 bits

    const totalSupplyHex = ethers.utils.hexZeroPad(
        ethers.utils.hexValue(totalSupply),
        5
    ); // 5 bytes => 40 bits

    const predicatedIdHex = ethers.utils.hexStripZeros(
        ethers.utils.hexConcat([creator, indexHex, totalSupplyHex])
    );

    const predicatedId = ethers.BigNumber.from(predicatedIdHex).toString();

    return predicatedId;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_BYTES32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
const NULL_SIG = { v: 27, r: ZERO_BYTES32, s: ZERO_BYTES32 };
const CHAIN_ID = network.config.chainId;

const FEE_DENOMINATOR = 10000;

const atomicMatch = (
    order,
    sig,
    call,
    counterorder,
    countersig,
    countercall,
    metadata
) =>
    exchange.atomicMatch_(
        [
            order.registry,
            order.maker,
            order.staticTarget,
            order.maximumFill,
            order.listingTime,
            order.expirationTime,
            order.salt,
            call.target,
            counterorder.registry,
            counterorder.maker,
            counterorder.staticTarget,
            counterorder.maximumFill,
            counterorder.listingTime,
            counterorder.expirationTime,
            counterorder.salt,
            countercall.target,
        ],
        [order.staticSelector, counterorder.staticSelector],
        order.staticExtradata,
        call.data,
        counterorder.staticExtradata,
        countercall.data,
        [call.howToCall, countercall.howToCall],
        metadata,
        web3.eth.abi.encodeParameters(
            ["bytes", "bytes"],
            [
                web3.eth.abi.encodeParameters(
                    ["uint8", "bytes32", "bytes32"],
                    [sig.v, sig.r, sig.s]
                ) + (sig.suffix || ""),
                web3.eth.abi.encodeParameters(
                    ["uint8", "bytes32", "bytes32"],
                    [countersig.v, countersig.r, countersig.s]
                ) + (countersig.suffix || ""),
            ]
        )
    );

// const WBNB_ADDRESS = "0xae13d989dac2f0debff460ac112a837c89baa7cd";
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

const WBNB_ABI = [
    {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { name: "guy", type: "address" },
            { name: "wad", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { name: "src", type: "address" },
            { name: "dst", type: "address" },
            { name: "wad", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [{ name: "wad", type: "uint256" }],
        name: "withdraw",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [{ name: "", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            { name: "dst", type: "address" },
            { name: "wad", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [],
        name: "deposit",
        outputs: [],
        payable: true,
        stateMutability: "payable",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            { name: "", type: "address" },
            { name: "", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    { payable: true, stateMutability: "payable", type: "fallback" },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "src", type: "address" },
            { indexed: true, name: "guy", type: "address" },
            { indexed: false, name: "wad", type: "uint256" },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "src", type: "address" },
            { indexed: true, name: "dst", type: "address" },
            { indexed: false, name: "wad", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "dst", type: "address" },
            { indexed: false, name: "wad", type: "uint256" },
        ],
        name: "Deposit",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "src", type: "address" },
            { indexed: false, name: "wad", type: "uint256" },
        ],
        name: "Withdrawal",
        type: "event",
    },
];

module.exports = {
    hashOrder,
    hashToSign,
    increaseTime,
    assertIsRejected,
    wrap,
    randomUint,
    getPredicateId,
    encodeMatchingCall,
    encode721MintingCall,
    encode1155MintingCall,
    ZERO_ADDRESS,
    ZERO_BYTES32,
    NULL_SIG,
    CHAIN_ID,
    FEE_DENOMINATOR,
    WBNB_ADDRESS,
    WBNB_ABI,
};
