// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ILabelCollection {
    function getCreditsInfo(uint256 tokenId)
        external
        view
        returns (address[] memory, uint256[] memory);
}

contract PaymentManager is Ownable {
    ILabelCollection public labelCollection;
    address public platformFeeRecipient;
    uint256 public platformFee;
    uint256 public feeDenominator = 10000;

    constructor(
        address _labelCollection,
        address _platformFeeRecipient,
        uint256 _platformFee
    ) {
        labelCollection = ILabelCollection(_labelCollection);
        platformFeeRecipient = _platformFeeRecipient;
        platformFee = _platformFee;
    }

    function setLabelCollection(address _labelCollection) external onlyOwner {
        labelCollection = ILabelCollection(_labelCollection);
    }

    function setPlatformFeeRecipient(address _platformFeeRecipient)
        external
        onlyOwner
    {
        platformFeeRecipient = _platformFeeRecipient;
    }

    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        platformFee = _platformFee;
    }

    function getFeeAmount(uint256 _total, uint256 _ratio)
        internal
        view
        returns (uint256)
    {
        return (_total * _ratio) / feeDenominator;
    }

    function payForNFT(
        address _from,
        address _to,
        uint256 _totalAmount,
        IERC20 _paymentToken,
        uint256 _nftId
    ) external {
        address[] memory feeRecipients;
        uint256[] memory feeRatios;

        (feeRecipients, feeRatios) = labelCollection.getCreditsInfo(_nftId);

        require(feeRecipients.length == feeRatios.length, "invalid fee info");
        uint256 payAmount = _totalAmount;

        // pay platform fees
        uint256 platformFeeAmount = getFeeAmount(_totalAmount, platformFee);
        _paymentToken.transferFrom(
            _from,
            platformFeeRecipient,
            platformFeeAmount
        );
        payAmount -= platformFeeAmount;

        // pay royalties
        for (uint256 i = 0; i < feeRatios.length; i++) {
            uint256 feeAmount = getFeeAmount(_totalAmount, feeRatios[i]);
            _paymentToken.transferFrom(_from, feeRecipients[i], feeAmount);
            payAmount -= feeAmount;
        }

        //transfer to seller
        _paymentToken.transferFrom(_from, _to, payAmount);
    }
}
