// SPDX-License-Identifier: Ulicensed

pragma solidity 0.7.5;
import "../wyvern/StaticMarket.sol";

contract LabelStaticMarket is StaticMarket {
    constructor() {}

    function anyERC1155ForERC20SplitFee(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "anyERC1155ForERC20: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "anyERC1155ForERC20: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address[2] memory paymentManagerReceiver,
            uint256[3] memory tokenIdAndNumeratorDenominator,
            string memory orderId
        ) = abi.decode(extra, (address[2], address[2], uint256[3], string));

        require(
            tokenIdAndNumeratorDenominator[1] > 0,
            "anyERC1155ForERC20: numerator must be larger than zero"
        );
        require(
            tokenIdAndNumeratorDenominator[2] > 0,
            "anyERC1155ForERC20: denominator must be larger than zero"
        );
        require(
            addresses[2] == tokenGiveGet[0],
            "anyERC1155ForERC20: call target must equal address of token to give"
        );
        require(
            addresses[5] == paymentManagerReceiver[0],
            "anyERC1155ForERC20: countercall target must equal address of payment manager"
        );

        uint256[2] memory call_amounts = [
            getERC1155AmountFromCalldata(data),
            getERC20AmountFromCalldata(counterdata)
        ];
        uint256 new_fill = SafeMath.add(uints[5], call_amounts[0]);
        require(
            new_fill <= uints[1],
            "anyERC1155ForERC20: new fill exceeds maximum fill"
        );

        require(
            SafeMath.mul(tokenIdAndNumeratorDenominator[1], call_amounts[1]) ==
                SafeMath.mul(
                    tokenIdAndNumeratorDenominator[2],
                    call_amounts[0]
                ),
            "anyERC1155ForERC20: wrong ratio"
        );
        checkERC1155Side(
            data,
            addresses[1],
            addresses[4],
            tokenIdAndNumeratorDenominator[0],
            call_amounts[0]
        );

        checkPaymentManager(
            counterdata,
            addresses[4],
            paymentManagerReceiver[1],
            call_amounts[1],
            tokenGiveGet[1],
            tokenGiveGet[0],
            tokenIdAndNumeratorDenominator[0],
            orderId
        );

        return new_fill;
    }

    function anyERC1155ForERC20SplitFeeDirect(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "anyERC1155ForERC20: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "anyERC1155ForERC20: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[3] memory tokenIdAndNumeratorDenominator,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[3], string));

        require(
            tokenIdAndNumeratorDenominator[1] > 0,
            "anyERC1155ForERC20: numerator must be larger than zero"
        );
        require(
            tokenIdAndNumeratorDenominator[2] > 0,
            "anyERC1155ForERC20: denominator must be larger than zero"
        );
        require(
            addresses[2] == tokenGiveGet[0],
            "anyERC1155ForERC20: call target must equal address of token to give"
        );
        require(
            addresses[5] == paymentManager,
            "anyERC1155ForERC20: countercall target must equal address of payment manager"
        );

        uint256[2] memory call_amounts = [
            getERC1155AmountFromCalldata(data),
            getERC20AmountFromCalldata(counterdata)
        ];
        uint256 new_fill = SafeMath.add(uints[5], call_amounts[0]);
        require(
            new_fill <= uints[1],
            "anyERC1155ForERC20: new fill exceeds maximum fill"
        );

        require(
            SafeMath.mul(tokenIdAndNumeratorDenominator[1], call_amounts[1]) ==
                SafeMath.mul(
                    tokenIdAndNumeratorDenominator[2],
                    call_amounts[0]
                ),
            "anyERC1155ForERC20: wrong ratio"
        );
        checkERC1155Side(
            data,
            addresses[1],
            addresses[4],
            tokenIdAndNumeratorDenominator[0],
            call_amounts[0]
        );

        checkPaymentManager(
            counterdata,
            addresses[4],
            addresses[1],
            call_amounts[1],
            tokenGiveGet[1],
            tokenGiveGet[0],
            tokenIdAndNumeratorDenominator[0],
            orderId
        );

        return new_fill;
    }

    function anyERC1155ForNative(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "anyERC1155ForNative: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[3] memory tokenIdAndNumeratorDenominator,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[3], string));

        require(
            tokenIdAndNumeratorDenominator[1] > 0,
            "anyERC1155ForNative: numerator must be larger than zero"
        );

        require(
            tokenIdAndNumeratorDenominator[2] > 0,
            "anyERC1155ForNative: denominator must be larger than zero"
        );

        require(
            addresses[2] == tokenGiveGet[0],
            "anyERC1155ForNative: call target must equal address of token to give"
        );

        require(
            addresses[5] == paymentManager,
            "anyERC1155ForNative: countercall target must equal address of payment manager"
        );

        uint256[2] memory call_amounts = [
            getERC1155AmountFromCalldata(data),
            getERC20AmountFromCalldata(counterdata)
        ];
        uint256 new_fill = SafeMath.add(uints[5], call_amounts[0]);

        require(
            uints[0] == call_amounts[1],
            "anyERC1155ForNative: invalid value"
        );

        require(
            new_fill <= uints[1],
            "anyERC1155ForNative: new fill exceeds maximum fill"
        );

        require(
            SafeMath.mul(tokenIdAndNumeratorDenominator[1], call_amounts[1]) ==
                SafeMath.mul(
                    tokenIdAndNumeratorDenominator[2],
                    call_amounts[0]
                ),
            "anyERC1155ForNative: wrong ratio"
        );

        checkERC1155Side(
            data,
            addresses[1],
            addresses[4],
            tokenIdAndNumeratorDenominator[0],
            call_amounts[0]
        );

        checkPaymentManager(
            counterdata,
            addresses[4],
            addresses[1],
            call_amounts[1],
            tokenGiveGet[1],
            tokenGiveGet[0],
            tokenIdAndNumeratorDenominator[0],
            orderId
        );

        return new_fill;
    }

    function anyERC20ForERC1155SplitFee(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "anyERC20ForERC1155: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "anyERC20ForERC1155: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address[2] memory paymentManagerReceiver,
            uint256[3] memory tokenIdAndNumeratorDenominator,
            string memory orderId
        ) = abi.decode(extra, (address[2], address[2], uint256[3], string));

        require(
            tokenIdAndNumeratorDenominator[1] > 0,
            "anyERC20ForERC1155: numerator must be larger than zero"
        );
        require(
            tokenIdAndNumeratorDenominator[2] > 0,
            "anyERC20ForERC1155: denominator must be larger than zero"
        );
        require(
            addresses[2] == paymentManagerReceiver[0],
            "anyERC20ForERC1155: call target must equal address of payment manager"
        );
        require(
            addresses[5] == tokenGiveGet[1],
            "anyERC20ForERC1155: countercall target must equal address of token to give"
        );

        uint256[2] memory call_amounts = [
            getERC1155AmountFromCalldata(counterdata),
            getERC20AmountFromCalldata(data)
        ];
        uint256 new_fill = SafeMath.add(uints[5], call_amounts[1]);
        require(
            new_fill <= uints[1],
            "anyERC20ForERC1155: new fill exceeds maximum fill"
        );
        require(
            SafeMath.mul(tokenIdAndNumeratorDenominator[1], call_amounts[0]) ==
                SafeMath.mul(
                    tokenIdAndNumeratorDenominator[2],
                    call_amounts[1]
                ),
            "anyERC20ForERC1155: wrong ratio"
        );
        checkERC1155Side(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndNumeratorDenominator[0],
            call_amounts[0]
        );

        checkPaymentManager(
            data,
            addresses[1],
            paymentManagerReceiver[1],
            call_amounts[1],
            tokenGiveGet[0],
            tokenGiveGet[1],
            tokenIdAndNumeratorDenominator[0],
            orderId
        );

        return new_fill;
    }

    function anyERC20ForERC1155SplitFeeDirect(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "anyERC20ForERC1155: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "anyERC20ForERC1155: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[3] memory tokenIdAndNumeratorDenominator,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[3], string));

        require(
            tokenIdAndNumeratorDenominator[1] > 0,
            "anyERC20ForERC1155: numerator must be larger than zero"
        );
        require(
            tokenIdAndNumeratorDenominator[2] > 0,
            "anyERC20ForERC1155: denominator must be larger than zero"
        );
        require(
            addresses[2] == paymentManager,
            "anyERC20ForERC1155: call target must equal address of payment manager"
        );
        require(
            addresses[5] == tokenGiveGet[1],
            "anyERC20ForERC1155: countercall target must equal address of token to give"
        );

        uint256[2] memory call_amounts = [
            getERC1155AmountFromCalldata(counterdata),
            getERC20AmountFromCalldata(data)
        ];
        uint256 new_fill = SafeMath.add(uints[5], call_amounts[1]);
        require(
            new_fill <= uints[1],
            "anyERC20ForERC1155: new fill exceeds maximum fill"
        );
        require(
            SafeMath.mul(tokenIdAndNumeratorDenominator[1], call_amounts[0]) ==
                SafeMath.mul(
                    tokenIdAndNumeratorDenominator[2],
                    call_amounts[1]
                ),
            "anyERC20ForERC1155: wrong ratio"
        );
        checkERC1155Side(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndNumeratorDenominator[0],
            call_amounts[0]
        );

        checkPaymentManager(
            data,
            addresses[1],
            addresses[4],
            call_amounts[1],
            tokenGiveGet[0],
            tokenGiveGet[1],
            tokenIdAndNumeratorDenominator[0],
            orderId
        );

        return new_fill;
    }

    function nativeForERC1155(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "nativeForERC1155: Zero value required");

        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "nativeForERC1155: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[3] memory tokenIdAndNumeratorDenominator,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[3], string));

        require(
            tokenIdAndNumeratorDenominator[1] > 0,
            "nativeForERC1155: numerator must be larger than zero"
        );
        require(
            tokenIdAndNumeratorDenominator[2] > 0,
            "nativeForERC1155: denominator must be larger than zero"
        );
        require(
            addresses[2] == paymentManager,
            "nativeForERC1155: call target must equal address of payment manager"
        );
        require(
            addresses[5] == tokenGiveGet[1],
            "nativeForERC1155: countercall target must equal address of token to give"
        );

        uint256[2] memory call_amounts = [
            getERC1155AmountFromCalldata(counterdata),
            getERC20AmountFromCalldata(data)
        ];
        uint256 new_fill = SafeMath.add(uints[5], call_amounts[1]);

        require(
            new_fill <= uints[1],
            "nativeForERC1155: new fill exceeds maximum fill"
        );

        require(
            SafeMath.mul(tokenIdAndNumeratorDenominator[1], call_amounts[0]) ==
                SafeMath.mul(
                    tokenIdAndNumeratorDenominator[2],
                    call_amounts[1]
                ),
            "nativeForERC1155: wrong ratio"
        );
        checkERC1155Side(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndNumeratorDenominator[0],
            call_amounts[0]
        );

        checkPaymentManager(
            data,
            addresses[1],
            addresses[4],
            call_amounts[1],
            tokenGiveGet[0],
            tokenGiveGet[1],
            tokenIdAndNumeratorDenominator[0],
            orderId
        );

        return new_fill;
    }

    function ERC721ForERC20SplitFeeDirect(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "ERC721ForERC20: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "ERC721ForERC20: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[2] memory tokenIdAndPrice,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[2], string));

        require(
            tokenIdAndPrice[1] > 0,
            "ERC721ForERC20: ERC721 price must be larger than zero"
        );
        require(
            addresses[2] == tokenGiveGet[0],
            "ERC721ForERC20: call target must equal address of token to give"
        );
        require(
            addresses[5] == paymentManager,
            "ERC721ForERC20: countercall target must equal address of payment manager"
        );

        checkERC721Side(data, addresses[1], addresses[4], tokenIdAndPrice[0]);
        checkPaymentManager(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndPrice[1],
            tokenGiveGet[1],
            tokenGiveGet[0],
            tokenIdAndPrice[0],
            orderId
        );

        return 1;
    }

    function ERC20ForERC721SplitFeeDirect(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "ERC20ForERC721: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "ERC20ForERC721: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[2] memory tokenIdAndPrice,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[2], string));

        require(
            tokenIdAndPrice[1] > 0,
            "ERC20ForERC721: ERC721 price must be larger than zero"
        );
        require(
            addresses[2] == paymentManager,
            "ERC20ForERC721: call target must equal address of paymentManager"
        );
        require(
            addresses[5] == tokenGiveGet[1],
            "ERC20ForERC721: countercall target must equal address of token to get"
        );

        checkERC721Side(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndPrice[0]
        );
        checkPaymentManager(
            data,
            addresses[1],
            addresses[4],
            tokenIdAndPrice[1],
            tokenGiveGet[0],
            tokenGiveGet[1],
            tokenIdAndPrice[0],
            orderId
        );

        return 1;
    }

    function ERC721ForNative(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        // require(uints[0] == 0, "ERC721ForERC20: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "ERC721ForERC20: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[2] memory tokenIdAndPrice,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[2], string));

        require(
            tokenIdAndPrice[1] > 0,
            "ERC721ForERC20: ERC721 price must be larger than zero"
        );
        require(
            addresses[2] == tokenGiveGet[0],
            "ERC721ForERC20: call target must equal address of token to give"
        );
        require(
            addresses[5] == paymentManager,
            "ERC721ForERC20: countercall target must equal address of paymentManager"
        );

        checkERC721Side(data, addresses[1], addresses[4], tokenIdAndPrice[0]);

        checkPaymentManager(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndPrice[1],
            tokenGiveGet[1],
            tokenGiveGet[0],
            tokenIdAndPrice[0],
            orderId
        );

        return 1;
    }

    function NativeForERC721(
        bytes memory extra,
        address[7] memory addresses,
        AuthenticatedProxy.HowToCall[2] memory howToCalls,
        uint256[6] memory uints,
        bytes memory data,
        bytes memory counterdata
    ) public pure returns (uint256) {
        require(uints[0] == 0, "ERC20ForERC721: Zero value required");
        require(
            howToCalls[0] == AuthenticatedProxy.HowToCall.Call,
            "ERC20ForERC721: call must be a direct call"
        );

        (
            address[2] memory tokenGiveGet,
            address paymentManager,
            uint256[2] memory tokenIdAndPrice,
            string memory orderId
        ) = abi.decode(extra, (address[2], address, uint256[2], string));

        require(
            tokenIdAndPrice[1] > 0,
            "ERC20ForERC721: ERC721 price must be larger than zero"
        );
        require(
            addresses[2] == paymentManager,
            "ERC20ForERC721: call target must equal address of paymentManager"
        );
        require(
            addresses[5] == tokenGiveGet[1],
            "ERC20ForERC721: countercall target must equal address of token to get"
        );

        checkERC721Side(
            counterdata,
            addresses[4],
            addresses[1],
            tokenIdAndPrice[0]
        );
        checkPaymentManager(
            data,
            addresses[1],
            addresses[4],
            tokenIdAndPrice[1],
            tokenGiveGet[0],
            tokenGiveGet[1],
            tokenIdAndPrice[0],
            orderId
        );

        return 1;
    }

    function checkPaymentManager(
        bytes memory data,
        address from,
        address to,
        uint256 amount,
        address paymentToken,
        address collectionAddress,
        uint256 nftId,
        string memory orderId
    ) internal pure {
        require(
            ArrayUtils.arrayEq(
                data,
                abi.encodeWithSignature(
                    "payForNFT(address,address,uint256,address,address,uint256,string)",
                    from,
                    to,
                    amount,
                    paymentToken,
                    collectionAddress,
                    nftId,
                    orderId
                )
            )
        );
    }
}
