// SPDX-License-Identifier: MIT
pragma solidity 0.8;

import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import './MAGIC/IAtlasMine.sol';

contract  MagicStaking is Ownable,IERC721Receiver{

    using EnumerableSet for EnumerableSet.UintSet;

    address public treasure;
    address public legion;

    // user => tokenId => transferedAmount(treasure)
    mapping (address => mapping(uint256 =>uint256)) public  treasuredAmount;

    // user => tokenIds(legion)
    mapping(address => EnumerableSet.UintSet) private legionAmount;

    IAtlasMine public atlasMine;

    // EVENTS

    event NftTransfered(address nft, uint256 tokenId, uint256 amount);
    event NftWithdrawn(address nft, address to,uint256 tokenId, uint256 amount);
    event NftStaked(address nft, uint256 tokenId, uint256 amount);
    event NftUnstaked(address nft, uint256 tokenId, uint256 amount);
    event AtlasMineChanged(address atlasMine);
    event TreasureChanged(address treasure);
    event LegionChanged(address legion);

    constructor(address _atlasMine,address _treasure,address _legion) {
        atlasMine = IAtlasMine(_atlasMine);
        treasure = _treasure;
        legion = _legion;
        IERC1155(treasure).setApprovalForAll(_atlasMine,true);
    }

    function setAtlasMine(address _atlasMine)external onlyOwner{
        require(_atlasMine != address(0),"atlasmine zero address");
        require(address(atlasMine) != _atlasMine,"Same atlasmine address");
        atlasMine = IAtlasMine(_atlasMine);
        emit AtlasMineChanged(address(atlasMine));
    }

    function setTreasure(address _treasure)external onlyOwner{
        require(_treasure != address(0),"treasure zero address");
        require(treasure != _treasure,"Same _treasure address");
        treasure = _treasure;
        emit TreasureChanged(treasure);
    }

    function setLegion(address _legion)external onlyOwner{
        require(_legion != address(0),"legion zero address");
        require(legion != _legion,"Same legion address");
        legion = _legion;
        emit LegionChanged(legion);
    }

    function stakeTreasure(uint256 _tokenId, uint256 _amount) external onlyOwner{
        atlasMine.stakeTreasure(_tokenId,_amount);
        emit NftStaked(treasure,_tokenId,_amount);
    }

    function unStakeTreasure(uint256 _tokenId, uint256 _amount) external onlyOwner{
        atlasMine.unstakeTreasure(_tokenId,_amount);
        emit NftUnstaked(treasure, _tokenId, _amount);
    }

    //Not tracking staked legion and treasure ,because we can get access it 
    //from atlasmine.legionStaked() and atlasmine.treasureStakedAmount()

    function stakeLegion(uint256 _tokenId) external onlyOwner{
        IERC721(legion).approve(address(atlasMine),_tokenId);
        atlasMine.stakeLegion(_tokenId);
        emit NftStaked(legion,_tokenId,1);
    }

    function unStakeLegion(uint256 _tokenId) external onlyOwner{
        atlasMine.unstakeLegion(_tokenId);
        emit NftUnstaked(legion, _tokenId, 1);
    }

    //Approve treasure NFT (call setApprovalForAll()) and then transfer treasure

    function transferTreasure(uint256 _tokenId, uint256 _amount) external onlyOwner{
        require(treasure != address(0), 'Cannot transfer Treasures');
        require(_amount > 0, 'Amount is 0');
        treasuredAmount[msg.sender][_tokenId] += _amount;
        IERC1155(treasure).safeTransferFrom(msg.sender,address(this),_tokenId,_amount,bytes(""));
        emit NftTransfered(treasure,_tokenId,_amount);
    }

    //Approve legion NFT (call approve()) and then transfer legion
 
    function transferLegions(uint256 _tokenId) external onlyOwner{
        require(legion != address(0), 'Cannot transfer Legions');
        require(legionAmount[msg.sender].add(_tokenId), 'NFT already trasnfered');
        IERC721(legion).safeTransferFrom(msg.sender, address(this), _tokenId);
        emit NftTransfered(legion,_tokenId,1); 
    }

    function withdrawTreasure(address to,uint256 _tokenId,uint256 _amount) external onlyOwner{
        treasuredAmount[msg.sender][_tokenId] -= _amount;
        IERC1155(treasure).safeTransferFrom(address(this), to, _tokenId, _amount, bytes(''));
        emit NftWithdrawn(treasure,to,_tokenId,_amount);
    }

    function withdrawLegion(address to,uint256 _tokenId) external onlyOwner{
        require(legionAmount[msg.sender].remove(_tokenId), 'Non existed NFT');
        IERC721(legion).safeTransferFrom(address(this), to, _tokenId);
        emit NftWithdrawn(legion,to,_tokenId,1);
    }

    function getTransferedLegions(address _user) external view returns (uint256[] memory) {
        return legionAmount[_user].values();
    }

    function onERC721Received(
        address,
        address ,
        uint256,
        bytes calldata
    ) external pure  returns (bytes4) {
      return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(
        address ,
        address ,
        uint256 ,
        uint256 ,
        bytes calldata 
    ) external pure  returns (bytes4) {
      return IERC1155Receiver.onERC1155Received.selector;
    }

}