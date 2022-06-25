// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/*
  DESIGN NOTES:
  Token ids are a concatenation of:
 * creator: hex address of the creator of the token. 160 bits
 * index: Index for this token (the regular ID), up to 2^56 - 1. 56 bits
 * supply: Supply cap for this token, up to 2^40 - 1 (1 trillion).  40 bits

*/

library TokenIdentifiers {
    uint8 constant ADDRESS_BITS = 160;
    uint8 constant INDEX_BITS = 56;
    uint8 constant SUPPLY_BITS = 40;

    uint256 constant SUPPLY_MASK = (uint256(1) << SUPPLY_BITS) - 1;
    uint256 constant INDEX_MASK =
        ((uint256(1) << INDEX_BITS) - 1) ^ SUPPLY_MASK;

    function tokenMaxSupply(uint256 _id) internal pure returns (uint256) {
        return _id & SUPPLY_MASK;
    }

    function tokenIndex(uint256 _id) internal pure returns (uint256) {
        return _id & INDEX_MASK;
    }

    function tokenCreator(uint256 _id) internal pure returns (address) {
        return address(uint160(_id >> (INDEX_BITS + SUPPLY_BITS)));
    }
}

contract OwnableDelegateProxy {}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

contract LabelArtWork721 is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    struct CreatorsInfo {
        address[] creators;
        uint256[] royalties;
        uint256 totalRoyalty;
    }

    mapping(uint256 => CreatorsInfo) private _tokenCredit;

    address proxyRegistryAddress;
    string public nftBaseURI;
    mapping(address => bool) private isMinter;

    modifier onlyMinter() {
        require(isMinter[msg.sender] || msg.sender == owner(), "Not minter");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize(
        string memory _nftBaseURI,
        address _proxyRegistryAddress
    ) public initializer {
        __ERC721_init("Label Artwork", "LABEL");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        nftBaseURI = _nftBaseURI;
        proxyRegistryAddress = _proxyRegistryAddress;
        isMinter[msg.sender] = true;
    }

    function getCreditsInfo(uint256 tokenId)
        public
        view
        returns (
            address[] memory,
            uint256[] memory,
            uint256
        )
    {
        CreatorsInfo memory credit = _tokenCredit[tokenId];

        return (credit.creators, credit.royalties, credit.totalRoyalty);
    }

    function getTokenCreatorById(uint256 tokenId)
        public
        pure
        returns (address)
    {
        return TokenIdentifiers.tokenCreator(tokenId);
    }

    function getTokenIndexById(uint256 tokenId) public pure returns (uint256) {
        return TokenIdentifiers.tokenIndex(tokenId);
    }

    function getTokenMaxSupplyById(uint256 tokenId)
        public
        pure
        returns (uint256)
    {
        return TokenIdentifiers.tokenMaxSupply(tokenId);
    }

    function setMinterRole(address[] memory minters, bool isAuthorized)
        external
        onlyOwner
    {
        for (uint8 i = 0; i < minters.length; i++) {
            isMinter[minters[i]] = isAuthorized;
        }
    }

    function setProxyRegistryAddress(address _proxyRegistryAddress)
        external
        onlyOwner
    {
        proxyRegistryAddress = _proxyRegistryAddress;
    }

    function _baseURI() internal view override returns (string memory) {
        return nftBaseURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(
        address to,
        uint256 tokenId,
        string memory uri,
        address[] memory creators,
        uint256[] memory royalties,
        uint256 totalRoyalty
    ) public onlyMinter {
        require(!_exists(tokenId), "Token existed");

        require(
            TokenIdentifiers.tokenCreator(tokenId) == creators[0],
            "Invalid ID and creator"
        );

        CreatorsInfo storage info = _tokenCredit[tokenId];
        info.creators = creators;
        // check
        uint256 royaltySum = 0;

        for (uint256 i = 0; i < royalties.length; i++) {
            royaltySum += royalties[i];
        }

        require(royaltySum == 10000, "Invalid royalties");

        info.royalties = royalties;
        info.totalRoyalty = totalRoyalty;
        _safeMint(creators[0], tokenId);
        if (to != creators[0]) {
            _transfer(creators[0], to, tokenId);
        }
        _setTokenURI(tokenId, uri);
    }

    function multiTransferFrom(
        address from,
        address[] memory tos,
        uint256[] memory ids
    ) external {
        for (uint256 i = 0; i < tos.length; i++) {
            transferFrom(from, tos[i], ids[i]);
        }
    }

    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    )
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
