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
                )
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

module.exports = {
    hashOrder,
    hashToSign,
    increaseTime,
    assertIsRejected,
    wrap,
    randomUint,
    getPredicateId,
    ZERO_ADDRESS,
    ZERO_BYTES32,
    NULL_SIG,
    CHAIN_ID,
    FEE_DENOMINATOR,
};
