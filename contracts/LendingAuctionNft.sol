// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import {IMagicDepositor,IMagicNftDepositor} from "./Interfaces.sol";
import "./MAGIC/IAtlasMine.sol";

contract LendingAuctionNft is Initializable, OwnableUpgradeable{

    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;

    address public  treasure; //treasure erc1155 nft in atlasmine
    address public  legion; //legion erc721 nft in atlasmine
    IAtlasMine public atlasmine;
    IMagicNftDepositor public magicDepositor; //magicDepositor contract

    struct UserBoost{
        address user;
        uint256 boost;
        uint256 nftDepositedTime;
        uint256 tokenId;
        uint256 amount;
    }

    struct LegionPool{
        //Legion Nft to total Staked
        EnumerableSetUpgradeable.UintSet  deposits;
        UserBoost[] userBoosts;//All added boost
    } 

    struct TreasurePool{
        //totalStaked 
        uint256 deposits; 
        //  tokenId => total Staked Treasure
        // mapping(uint256 => uint256) stakedTreasurePerTokenId;
        UserBoost[] userBoosts;//All added boost
    }

    LegionPool legionMainPool;
    LegionPool  legionReservePool;
    TreasurePool  treasureMainPool;
    TreasurePool  treasureReservePool;
    
    // EVENTS

    event Deposit(address nft, uint256 tokenId, uint256 amount);


    function initialize(
        address _treasure,address _legion,address _atlasMine,address _magicDepositor
    ) external initializer {
        __Ownable_init_unchained();
        treasure = _treasure;
        legion = _legion;
        atlasmine = IAtlasMine(_atlasMine);
        magicDepositor = IMagicNftDepositor(_magicDepositor);
        IERC1155Upgradeable(treasure).setApprovalForAll(_magicDepositor, true);
        IERC721Upgradeable(legion).setApprovalForAll(_magicDepositor, true);
    }

    // Depositing NFT 

    function depositLegion(uint256 tokenId) external   {
        require(legion != address(0), "Cannot deposit Legion");
       _depositLegion(tokenId);
        emit Deposit(legion, tokenId, 1);
    }

    function depositTreasures(uint256 tokenId,uint256 amount) external   {
        require(treasure != address(0), "Cannot deposit Treasure");
        require(amount > 0, "Amount is 0");
        uint256 leftTreasureInMainPool = 20 - treasureInMainPool();
        if(leftTreasureInMainPool != 0)
        amount = amount >  leftTreasureInMainPool ? leftTreasureInMainPool : amount ;
       _depositTreasures(tokenId,amount);
        emit Deposit(treasure, tokenId, amount);
    } 


    function _depositLegion(uint256 _tokenId) internal{
        uint256 nftBoost = _getBoost(legion,_tokenId,1);
        bool isLegion1_1Staked = _checkLegion1Staked();
        if(isLegion1_1Staked){
            _addToLegionReservePool(_tokenId,nftBoost);
            return;
        }
        if(legionMainPoolLength() < 3 ){
            _addToLegionMainPool(_tokenId,nftBoost);
        } 
        else{
            (bool find,int256 findIndex )= _getHigherExistingBoost(legionMainPool.userBoosts,nftBoost,1);
            if(find){
                // Removing lower rarity legion nft from mainLegionPool
                UserBoost memory removingUserBoost = _removeLegionFromPool(legionMainPool,uint256(findIndex));
                
                // Adding removed nft , to reserveLegionPool
                legionReservePool.userBoosts.push(removingUserBoost);
                legionReservePool.deposits.add(removingUserBoost.tokenId);
                
                // Adding upcomming Higher rarity NFT to mainLegionPool
                _addToLegionMainPool(_tokenId,nftBoost);
            }
            else{
                // Add Nft to reserve pool
                _addToLegionReservePool(_tokenId,nftBoost);
            }
        }
    }

    function _depositTreasures(uint256 _tokenId,uint256 _amount) internal{
        uint256 nftBoost = _getBoost(legion,_tokenId,_amount);       
        if(treasureInMainPool() < 20 ){
            _addToTreasureMainPool(_tokenId,nftBoost,_amount);
        }  
        else{
            (bool find,int256 findIndex) = _getHigherExistingBoost(treasureMainPool.userBoosts,nftBoost,_amount);
            if(find){
                // Removing lower rarity legion nft from mainLegionPool
                UserBoost memory removingUserBoost = _removeTreasureFromPool(treasureMainPool,uint256(findIndex));
                
                // Adding removed nft , to reserveLegionPool
                treasureReservePool.userBoosts.push(removingUserBoost);
                treasureReservePool.deposits += removingUserBoost.amount;
                
                // Adding upcomming Higher rarity NFT to mainTreasurePool
                _addToTreasureMainPool(_tokenId,nftBoost,_amount);
            }
            else{
                // Add Nft to reserve pool
                _addToTreasureReservePool(_tokenId,nftBoost,_amount);
            }
        }
    }


    function _addToLegionMainPool(uint256 _tokenId,uint256 _nftBoost) internal{
        IERC721Upgradeable(legion).transferFrom(msg.sender, address(magicDepositor), _tokenId);
        magicDepositor.stakeLegion(_tokenId); 
        _addLegionToPool(legionMainPool,_tokenId,_nftBoost);      
    }

    function _addToLegionReservePool(uint256 _tokenId,uint256 _nftBoost) internal{
        IERC721Upgradeable(legion).transferFrom(msg.sender, address(this), _tokenId);
        _addLegionToPool(legionReservePool,_tokenId,_nftBoost);      
    }

     function _addToTreasureMainPool(uint256 _tokenId,uint256 _nftBoost,uint256 _amount) internal{
        IERC1155Upgradeable(treasure).safeTransferFrom(
            msg.sender,
            address(magicDepositor),
            _tokenId,
            _amount,
            bytes("")
        );
        magicDepositor.stakeTreasure(_tokenId,_amount); 
        _addTreasureToPool(treasureMainPool,_tokenId,_nftBoost,_amount);      
    }

    function _addToTreasureReservePool(uint256 _tokenId,uint256 _nftBoost,uint256 _amount) internal{
        IERC1155Upgradeable(treasure).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            _amount,
            bytes("")
        );
        _addTreasureToPool(treasureReservePool,_tokenId,_nftBoost,_amount);      
    }

    function _removeLegionFromPool(LegionPool storage pool,uint256 _findIndex)internal returns(UserBoost memory removedUserBoost){ 
        UserBoost[] storage userBoosts = pool.userBoosts;
        removedUserBoost = userBoosts[_findIndex];
        uint256 removedTokenId = removedUserBoost.tokenId ;
        magicDepositor.unStakeLegion(removedTokenId);
        userBoosts[_findIndex] = userBoosts[userBoosts.length - 1];
        userBoosts.pop();
        pool.deposits.remove(removedTokenId);
        return removedUserBoost;
    }

    function _removeTreasureFromPool(TreasurePool storage pool,uint256 _findIndex)internal returns( UserBoost memory removedUserBoost){ 
        UserBoost[] storage userBoosts = pool.userBoosts;
        removedUserBoost = userBoosts[_findIndex];
        uint256 _tokenId = removedUserBoost.tokenId ;
        uint256 _amount = removedUserBoost.amount ;
        magicDepositor.unStakeTreasure(_tokenId,_amount);
        userBoosts[_findIndex] = userBoosts[userBoosts.length - 1];
        userBoosts.pop();
        pool.deposits -= _amount;
    }

    function _addLegionToPool(LegionPool storage pool,uint256 _tokenId,uint256 _nftBoost) internal{
        UserBoost memory userBoost = UserBoost(msg.sender,_nftBoost,block.timestamp,_tokenId,1);
        pool.userBoosts.push(userBoost);
        pool.deposits.add(_tokenId);
    }

    function _addTreasureToPool(TreasurePool storage pool,uint256 _tokenId,uint256 _nftBoost,uint256 _amount) internal{
        UserBoost memory userBoost = UserBoost(msg.sender,_nftBoost,block.timestamp,_tokenId,_amount);
        pool.userBoosts.push(userBoost);
        pool.deposits += _amount;
    }

    // will return true/false and array index 
    // true if we find higher boost than existing 
    // false if we don't find higher boost than exiting 

    function _getHigherExistingBoost(UserBoost[] memory userBoosts,uint256 _currentNftBoost,uint256 _currentAmount) internal pure returns(bool,int256 index){
        uint256 len = userBoosts.length;
        if(len == 0)
        return (false,-1);
        // require(userBoosts.length == 3,"At least three users");
        uint256  minBoost = userBoosts[0].boost;
        for(uint256 i=0; i< len;i++){
            uint256 currentUserBoost = userBoosts[i].boost;
            uint256 currentUserAmount = userBoosts[i].amount;
            if(_currentAmount <= currentUserAmount  && minBoost > currentUserBoost){
               minBoost = currentUserBoost;
               index = int256(i);
            }
        }
        uint256  minDepositedtime = 0;
        for(uint256 i=0; i< len;i++){
            if(userBoosts[i].boost == minBoost){
                uint256  currentMinDepositedtime = userBoosts[i].nftDepositedTime;
                if(minDepositedtime < currentMinDepositedtime){
                    minDepositedtime = currentMinDepositedtime;
                    index = int256(i);
                }
            }
        }
        if (_currentNftBoost > minBoost)
        return (true,index);
        else
        return (false,-1);
    }

    function _getBoost(address _nft,uint256 _tokenId,uint256 _amount) internal view  returns(uint256){
        return atlasmine.getNftBoost(_nft,_tokenId,_amount);
    }

    function _checkLegion1Staked() internal view returns(bool){
        bool isLegion1_1Staked = atlasmine.isLegion1_1Staked(address(magicDepositor));
        return isLegion1_1Staked;
  
     }

    function legionMainPoolLength() public view returns(uint256){
        return legionMainPool.deposits.values().length;
    }

    function treasureInMainPool() public view returns(uint256){
        return treasureMainPool.deposits;
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