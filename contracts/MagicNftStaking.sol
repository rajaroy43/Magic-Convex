// SPDX-License-Identifier: MIT
pragma solidity 0.8;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MAGIC/IAtlasMine.sol";

/// @title MagicNftStaking
/// @notice nft staking by magicDepositor for boosting rewards
contract MagicNftStaking is Initializable, OwnableUpgradeable {
    address public treasure; //treasure erc1155 nft in atlasmine
    address public legion; //legion erc721 nft in atlasmine

    IAtlasMine public atlasMine; //AtlasMine contract

    uint256[50] private __gap;

    // EVENTS

    /// @notice Event for withdrawing nft tokens
    /// @param nft Address of nft token
    /// @param to Address of user that receives nft token
    /// @param tokenId nft token id
    /// @param amount Amount of nft token
    event NftWithdrawn(address nft, address to, uint256 tokenId, uint256 amount);

    /// @notice Event for setting atlasmine contract
    /// @param atlasMine Address of atlasmine contract
    event AtlasMineChanged(address atlasMine);

    /// @notice Event for setting treasure contract
    /// @param treasure Address of treasure contract
    event TreasureChanged(address treasure);

    /// @notice Event for setting legion contract
    /// @param legion Address of legion contract
    event LegionChanged(address legion);

    function __MagicStaking_init_unchained(
        address _atlasMine,
        address _treasure,
        address _legion
    ) internal onlyInitializing {
        atlasMine = IAtlasMine(_atlasMine);
        treasure = _treasure;
        legion = _legion;
        IERC1155(treasure).setApprovalForAll(_atlasMine, true);
        IERC721(legion).setApprovalForAll(_atlasMine, true);
    }

    /// @notice setting atlasmine contract
    /// @param _atlasMine atlasmine contract address

    function setAtlasMine(address _atlasMine) external onlyOwner {
        require(_atlasMine != address(0), "atlasmine zero address");
        require(address(atlasMine) != _atlasMine, "same atlasMine address");
        atlasMine = IAtlasMine(_atlasMine);
        emit AtlasMineChanged(address(atlasMine));
    }

    /// @notice setting treasure contract
    /// @param _treasure treasure contract address

    function setTreasure(address _treasure) external onlyOwner {
        require(_treasure != address(0), "treasure zero address");
        require(treasure != _treasure, "same treasure address");
        treasure = _treasure;
        emit TreasureChanged(treasure);
    }

    /// @notice setting legion contract
    /// @param _legion legion contract address

    function setLegion(address _legion) external onlyOwner {
        require(_legion != address(0), "legion zero address");
        require(legion != _legion, "same legion address");
        legion = _legion;
        emit LegionChanged(legion);
    }

    /// @notice staking treasure nft in atlasmine for boosting rewards
    /// @param tokenId treasure token id
    /// @param amount amount of tokenId

    function stakeTreasure(uint256 tokenId, uint256 amount) external onlyOwner {
        atlasMine.stakeTreasure(tokenId, amount);
    }

    /// @notice unstaking treasure nft in atlasmine
    /// @param tokenId treasure token id
    /// @param amount amount of tokenId

    function unStakeTreasure(uint256 tokenId, uint256 amount) external onlyOwner {
        atlasMine.unstakeTreasure(tokenId, amount);
    }

    /// @notice staking legion nft in atlasmine
    /// @param tokenId legion nft token id

    function stakeLegion(uint256 tokenId) external onlyOwner {
        atlasMine.stakeLegion(tokenId);
    }

    /// @notice unstaking legion nft from atlasmine
    /// @param tokenId legion nft token id

    function unStakeLegion(uint256 tokenId) external onlyOwner {
        atlasMine.unstakeLegion(tokenId);
    }

    /// @notice withdrawing any erc1155 nfts
    /// @param nft nft token address
    /// @param to transfering nft to `to` address
    /// @param tokenId nft token id
    /// @param amount amount of tokenId

    function withdrawERC1155(
        address nft,
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(nft != address(0), "nft address zero");
        IERC1155(nft).safeTransferFrom(address(this), to, tokenId, amount, bytes(""));
        emit NftWithdrawn(nft, to, tokenId, amount);
    }

    /// @notice withdrawing any erc721 nft
    /// @param nft nft token address
    /// @param to transfering nft to `to` address
    /// @param tokenId nft token id

    function withdrawERC721(
        address nft,
        address to,
        uint256 tokenId
    ) external onlyOwner {
        require(nft != address(0), "nft address zero");
        IERC721(nft).safeTransferFrom(address(this), to, tokenId);
        emit NftWithdrawn(nft, to, tokenId, 1);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }
}
