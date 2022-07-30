// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./libraries/TransferHelper.sol";

interface IERC721 {
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

contract TreasuryContract is 
    Initializable, 
    ReentrancyGuardUpgradeable
    {
    address public admin;

    function initialize(address _admin) external initializer {
        admin = _admin;
    }

    event LogLockToken(
        address indexed user,
        uint256 userId,
        address indexed token,
        uint256 amount
    );

    receive() external payable {
        (bool success, ) = admin.call{value: msg.value}("");
        require(success, "transfer failed");
    }

    function depositToken(
        address token,
        uint256 amount,
        uint256 userId
    ) external payable nonReentrant {
        if (token == address(0)) {
            require(msg.value == amount, "value does not mapping");
            require(msg.value > 0, "must the value be non-zero");
            (bool success, ) = admin.call{value: msg.value}("");
            require(success, "transfer failed");
        } else {
            TransferHelper.safeTransferFrom(token, msg.sender, admin, amount);
        }
        emit LogLockToken(msg.sender, userId, token, amount);
    }

    event LogLockNft(
        address indexed user,
        uint256 userId,
        address indexed collection,
        uint256 tokenId
    );

    function depositNft(
        address collection,
        uint256 tokenId,
        uint256 userId
    ) external nonReentrant {
        IERC721(collection).safeTransferFrom(msg.sender, admin, tokenId);
        emit LogLockNft(msg.sender, userId, collection, tokenId);
    }
}   