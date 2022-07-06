// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MintingMachine is Ownable {
    mapping(address => bool) public isLabelCollection;

    event BatchMinted(uint256 indexed id, bool[] results);

    constructor(address[] memory _collections) {
        _setCollections(_collections, true);
    }

    function _setCollections(
        address[] memory _collections,
        bool _isLabelCollection
    ) internal {
        for (uint8 i = 0; i < _collections.length; i++) {
            isLabelCollection[_collections[i]] = _isLabelCollection;
        }
    }

    function setCollections(
        address[] memory _collections,
        bool _isLabelCollection
    ) external onlyOwner {
        _setCollections(_collections, _isLabelCollection);
    }

    function batchMint(
        uint256 id,
        address[] calldata callTarget,
        bytes[] calldata data
    ) external {
        require(callTarget.length == data.length, "invalid data length");
        bool[] memory results = new bool[](data.length);

        for (uint256 i = 0; i < data.length; i++) {
            require(
                isLabelCollection[callTarget[i]] == true,
                "not label collection"
            );

            (bool success, ) = callTarget[i].call(data[i]);
            results[i] = success;
        }
        emit BatchMinted(id, results);
    }
}
