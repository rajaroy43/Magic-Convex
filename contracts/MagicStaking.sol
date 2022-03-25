// SPDX-License-Identifier: MIT
pragma solidity 0.8;

import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './MAGIC/IAtlasMine.sol';

contract MagicStaking is Ownable {
    address public treasure;
    address public legion;

    IAtlasMine public atlasMine;

    // EVENTS
    event NftWithdrawn(address nft, address to, uint256 tokenId, uint256 amount);
    event AtlasMineChanged(address atlasMine);
    event TreasureChanged(address treasure);
    event LegionChanged(address legion);

    constructor(
        address _atlasMine,
        address _treasure,
        address _legion
    ) {
        atlasMine = IAtlasMine(_atlasMine);
        treasure = _treasure;
        legion = _legion;
        IERC1155(treasure).setApprovalForAll(_atlasMine, true);
        IERC721(legion).setApprovalForAll(_atlasMine, true);
    }

    function setAtlasMine(address _atlasMine) external onlyOwner {
        require(_atlasMine != address(0), 'atlasmine zero address');
        require(address(atlasMine) != _atlasMine, 'same atlasMine address');
        atlasMine = IAtlasMine(_atlasMine);
        emit AtlasMineChanged(address(atlasMine));
    }

    function setTreasure(address _treasure) external onlyOwner {
        require(_treasure != address(0), 'treasure zero address');
        require(treasure != _treasure, 'same treasure address');
        treasure = _treasure;
        emit TreasureChanged(treasure);
    }

    function setLegion(address _legion) external onlyOwner {
        require(_legion != address(0), 'legion zero address');
        require(legion != _legion, 'same legion address');
        legion = _legion;
        emit LegionChanged(legion);
    }

    function stakeTreasure(uint256 tokenId, uint256 amount) external onlyOwner {
        atlasMine.stakeTreasure(tokenId, amount);
    }

    function unStakeTreasure(uint256 tokenId, uint256 amount) external onlyOwner {
        atlasMine.unstakeTreasure(tokenId, amount);
    }

    //Not tracking staked legion and treasure ,because we can get access it
    //from atlasmine.legionStaked() and atlasmine.treasureStakedAmount()

    function stakeLegion(uint256 tokenId) external onlyOwner {
        atlasMine.stakeLegion(tokenId);
    }

    function unStakeLegion(uint256 tokenId) external onlyOwner {
        atlasMine.unstakeLegion(tokenId);
    }

    function withdrawERC1155(
        address nft,
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(nft != address(0), 'nft address zero');
        IERC1155(nft).safeTransferFrom(address(this), to, tokenId, amount, bytes(''));
        emit NftWithdrawn(nft, to, tokenId, amount);
    }

    function withdrawERC721(
        address nft,
        address to,
        uint256 tokenId
    ) external onlyOwner {
        require(nft != address(0), 'nft address zero');
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
