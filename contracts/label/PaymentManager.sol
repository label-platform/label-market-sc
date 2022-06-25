// SPDX-License-Identifier: Ulicensed
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IWBNB {
    function withdraw(uint256 wad) external;

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) external returns (bool);
}

interface ILabelCollection {
    function getCreditsInfo(uint256 tokenId)
        external
        view
        returns (
            address[] memory,
            uint256[] memory,
            uint256
        );
}

contract PaymentManager is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using AddressUpgradeable for address payable;

    address public platformFeeRecipient;
    uint256 public platformFee;
    uint256 public feeDenominator;

    mapping(address => bool) public labelCollections;

    address public wNative; // bsc testnet

    event PlatformFeeRecipientChanged(address feeRecipient);
    event PlatformFeeChanged(uint256 fee);
    event LabelCollectionChanged(address labelCollection);

    event PaymentTransferred(
        address from,
        address to,
        uint256 amount,
        address paymentToken,
        address nftCollection,
        uint256 tokenId,
        string systemOrderId
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address[] memory _labelCollections,
        address _platformFeeRecipient,
        uint256 _platformFee
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        for (uint256 i = 0; i < _labelCollections.length; i++) {
            _setLabelCollection(_labelCollections[i], true);
        }

        _setPlatformFeeRecipient(_platformFeeRecipient);
        _setPlatformFee(_platformFee);
        feeDenominator = 10000;
        wNative = 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd;
    }

    receive() external payable {}

    function _setLabelCollection(
        address _labelCollection,
        bool _isLabelCollection
    ) internal {
        require(_labelCollection != address(0), "invalid address");
        labelCollections[_labelCollection] = _isLabelCollection;
        emit LabelCollectionChanged(_labelCollection);
    }

    function _setPlatformFeeRecipient(address _platformFeeRecipient) internal {
        require(_platformFeeRecipient != address(0), "invalid address");
        platformFeeRecipient = _platformFeeRecipient;
        emit PlatformFeeRecipientChanged(_platformFeeRecipient);
    }

    function _setPlatformFee(uint256 _platformFee) internal {
        platformFee = _platformFee;
        emit PlatformFeeChanged(_platformFee);
    }

    function setWNative(address _wNative) external onlyOwner {
        wNative = _wNative;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setLabelCollection(
        address _labelCollection,
        bool _isLabelCollection
    ) external onlyOwner {
        _setLabelCollection(_labelCollection, _isLabelCollection);
    }

    function setPlatformFeeRecipient(address _platformFeeRecipient)
        external
        onlyOwner
    {
        _setPlatformFeeRecipient(_platformFeeRecipient);
    }

    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        _setPlatformFee(_platformFee);
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
        IERC20Upgradeable _paymentToken,
        ILabelCollection _nftCollection,
        uint256 _nftId,
        string memory _systemOrderId
    ) external payable whenNotPaused {
        require(
            labelCollections[address(_nftCollection)],
            "unrecognized collection"
        );

        if (address(_paymentToken) == address(0)) {
            _payWithNative(_from, _to, _totalAmount, _nftCollection, _nftId);
        } else {
            _payWithERC20(
                _from,
                _to,
                _totalAmount,
                _paymentToken,
                _nftCollection,
                _nftId
            );
        }

        emit PaymentTransferred(
            _from,
            _to,
            _totalAmount,
            address(_paymentToken),
            address(_nftCollection),
            _nftId,
            _systemOrderId
        );
    }

    function _payWithERC20(
        address _from,
        address _to,
        uint256 _totalAmount,
        IERC20Upgradeable _paymentToken,
        ILabelCollection _nftCollection,
        uint256 _nftId
    ) internal {
        address[] memory feeRecipients;
        uint256[] memory feeRatios;
        uint256 totalRoyalties;
        (feeRecipients, feeRatios, totalRoyalties) = _nftCollection
            .getCreditsInfo(_nftId);

        uint256 payAmount = _totalAmount;
        uint256 platformFeeAmount = getFeeAmount(_totalAmount, platformFee);
        uint256 totalRoyaltyAmount = getFeeAmount(_totalAmount, totalRoyalties);

        // pay platform fees
        _paymentToken.transferFrom(
            _from,
            platformFeeRecipient,
            platformFeeAmount
        );
        payAmount -= platformFeeAmount;

        // pay royalties
        for (uint256 i = 0; i < feeRatios.length; i++) {
            uint256 feeAmount = getFeeAmount(totalRoyaltyAmount, feeRatios[i]);
            _paymentToken.transferFrom(_from, feeRecipients[i], feeAmount);
            payAmount -= feeAmount;
        }

        // transfer the rest to seller
        _paymentToken.transferFrom(_from, _to, payAmount);
    }

    function _payWithNative(
        address _from,
        address _to,
        uint256 _totalAmount,
        ILabelCollection _nftCollection,
        uint256 _nftId
    ) internal {
        address[] memory feeRecipients;
        uint256[] memory feeRatios;
        uint256 totalRoyalties;
        (feeRecipients, feeRatios, totalRoyalties) = _nftCollection
            .getCreditsInfo(_nftId);

        uint256 payAmount = _totalAmount;
        uint256 platformFeeAmount = getFeeAmount(_totalAmount, platformFee);
        uint256 totalRoyaltyAmount = getFeeAmount(_totalAmount, totalRoyalties);

        IWBNB(payable(wNative)).transferFrom(
            _from,
            address(this),
            _totalAmount
        );

        IWBNB(payable(wNative)).withdraw(_totalAmount);

        // pay platform fee with native
        payable(platformFeeRecipient).sendValue(platformFeeAmount);
        payAmount -= platformFeeAmount;

        // pay royalties with native
        for (uint256 i = 0; i < feeRatios.length; i++) {
            uint256 feeAmount = getFeeAmount(totalRoyaltyAmount, feeRatios[i]);
            payable(feeRecipients[i]).sendValue(feeAmount);
            payAmount -= feeAmount;
        }

        // transfer the rest to seller
        payable(_to).sendValue(payAmount);
    }

    function multiTransfer(
        IERC20Upgradeable _paymentToken,
        address[] memory _receipients,
        uint256[] memory _amounts
    ) external whenNotPaused {
        require(_receipients.length == _amounts.length, "invalid amounts");
        for (uint256 i = 0; i < _receipients.length; i++) {
            _paymentToken.transferFrom(
                msg.sender,
                _receipients[i],
                _amounts[i]
            );
        }
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
