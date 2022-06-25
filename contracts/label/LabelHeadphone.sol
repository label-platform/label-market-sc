// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract LabelHeadset is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    struct CreatorsInfo {
        address[] creators;
        uint256[] royalties;
        uint256 totalRoyalty;
    }

    CreatorsInfo private _tokenCredit;

    uint256 public supplyCap;
    uint256 public currentId;
    string public nftBaseURI;

    mapping(uint256 => string) private _nftUpgradedURI;

    function initialize(
        string memory _nftBaseURI,
        uint256 _supplyCap,
        address[] memory _creators,
        uint256[] memory _royalties,
        uint256 _totalRoyalty
    ) public initializer {
        __ERC721_init("Label Headphone", "LABEL");
        __ERC721Enumerable_init();
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        nftBaseURI = _nftBaseURI;
        supplyCap = _supplyCap;
        _setCreditInfo(_creators, _royalties, _totalRoyalty);
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
        require(_exists(tokenId), "nft doesn't exist");
        CreatorsInfo memory credit = _tokenCredit;

        return (credit.creators, credit.royalties, credit.totalRoyalty);
    }

    function _setCreditInfo(
        address[] memory _creators,
        uint256[] memory _royalties,
        uint256 _totalRoyalty
    ) private {
        uint256 royaltiesSum = 0;
        for (uint256 i = 0; i < _royalties.length; i++) {
            royaltiesSum += _royalties[i];
        }
        require(royaltiesSum == 10000, "invalid royalties");
        _tokenCredit.creators = _creators;
        _tokenCredit.royalties = _royalties;
        _tokenCredit.totalRoyalty = _totalRoyalty;
    }

    function setCreditInfo(
        address[] memory _creators,
        uint256[] memory _royalties,
        uint256 _totalRoyalty
    ) external onlyOwner {
        _setCreditInfo(_creators, _royalties, _totalRoyalty);
    }

    function _baseURI() internal view override returns (string memory) {
        return nftBaseURI;
    }

    function setNftBaseURI(string memory _nftBaseURI) external onlyOwner {
        nftBaseURI = _nftBaseURI;
    }

    function upgradeNFT(uint256 tokenId, string memory _nftURI)
        external
        onlyOwner
    {
        require(_exists(tokenId), "nft doesn't exist");
        _nftUpgradedURI[tokenId] = _nftURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        string memory normalURI = super.tokenURI(tokenId);
        string memory upgradedURI = _nftUpgradedURI[tokenId];
        if (bytes(upgradedURI).length > 0) {
            return upgradedURI;
        }
        return normalURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setSupplyCap(uint256 _supplyCap) public onlyOwner {
        supplyCap = _supplyCap;
    }

    function mint(address to, uint256 quantity) public onlyOwner {
        require(currentId + quantity <= supplyCap, "supply cap exceeded");
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, currentId);
            currentId++;
        }
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

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        super._burn(tokenId);
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
