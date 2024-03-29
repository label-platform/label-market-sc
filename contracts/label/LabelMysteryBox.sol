// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract LabelMysteryBox is
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
    mapping(address => mapping(string => uint256)) public totalNFTsUserPurchasedPreSale;
    uint256 public MAXIMUM_PRESALE_LIMIT;

    event PreSaleOrderMatched(uint256[] tokenIds, string preSaleId);

    function initialize(
        string memory _nftBaseURI,
        // uint256 _supplyCap,
        address[] memory _creators,
        uint256[] memory _royalties,
        uint256 _totalRoyalty
    ) public initializer {
        __ERC721_init("TRACKS MYSTERY BOX", "TMB");
        __ERC721Enumerable_init();
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        nftBaseURI = _nftBaseURI;
        // supplyCap = _supplyCap;
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

    function upgradeNFT(uint256 tokenId, string memory _nftURI)
        external
        onlyOwner
    {
        require(_exists(tokenId), "nft doesn't exist");
        _nftUpgradedURI[tokenId] = _nftURI;
    }

    function setMaximumPreSaleLimit(uint256 _maximumPreSaleLimit) external onlyOwner {
        require(_maximumPreSaleLimit != 0, "Must be > 0");
        MAXIMUM_PRESALE_LIMIT = _maximumPreSaleLimit;
    }

    function resetTotalNFTsUserPurchasedPreSaleData (address _user, string calldata _preSaleId) external onlyOwner {
        require(_user != address(0), "Set to zero address");
        totalNFTsUserPurchasedPreSale[_user][_preSaleId] = 0;
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

    function _baseURI() internal view override returns (string memory) {
        return nftBaseURI;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 quantity) public onlyOwner {
        // require(currentId + quantity <= supplyCap, "supply cap exceeded");
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, currentId);
            currentId++;
        }
    }

    function batchTransfer(address from, address to, uint256[] calldata tokenIds, string calldata preSaleId) public {
        require(totalNFTsUserPurchasedPreSale[to][preSaleId] + tokenIds.length <= MAXIMUM_PRESALE_LIMIT, "NFTs purchased excceed limit!");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            safeTransferFrom(from, to, tokenIds[i]);
        }
        totalNFTsUserPurchasedPreSale[to][preSaleId] += tokenIds.length;
        emit PreSaleOrderMatched(tokenIds, preSaleId);
    }

    function setNftBaseURI(string memory _nftBaseURI) external onlyOwner {
        nftBaseURI = _nftBaseURI;
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