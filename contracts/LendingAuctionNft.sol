// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import {IMagicNftDepositor} from "./Interfaces.sol";
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
        mapping (uint256 => uint256) userIndex;
    } 

    struct TreasurePool{
        //totalStaked 
        uint256 deposits; 
        //  tokenId => total Staked Treasure
        // mapping(uint256 => uint256) stakedTreasurePerTokenId;
        UserBoost[] userBoosts;//All added boost
        // user => tokenId => stakedAmount
        mapping (address => mapping(uint256=> uint256)) stakedPerToken;
        // user => tokenId => amount => Index []
        mapping (address => mapping(uint256 => mapping(uint256 =>uint256[]))) userIndex;
    }

    LegionPool legionMainPool;
    LegionPool  legionReservePool;
    TreasurePool  treasureMainPool;
    TreasurePool  treasureReservePool;
    enum WhichPool {None, LegionMainPool,LegionReservePool,TreasureMainPool,TreasureReservePool}
    // User => TokenId => WhichPool
    mapping(address => mapping(uint256 => WhichPool)) isPool;
    
    // EVENTS

    event Deposit(address nft, uint256 tokenId, uint256 amount);
    event Withdrawn(address nft, uint256 tokenId, uint256 amount);
    event MagicDepositorChanged(address magicDepositor);


    function initialize(
        address _treasure,address _legion,address _atlasMine
    ) external initializer {
        __Ownable_init_unchained();
        treasure = _treasure;
        legion = _legion;
        atlasmine = IAtlasMine(_atlasMine);
    }

    /// @notice setting magicDepositor contract
    /// @param _magicDepositor magicDepositor contract address

    function setMagicDepositor(address _magicDepositor) external onlyOwner {
        require(_magicDepositor != address(0), "magicDepositor zero address");
        require(address(magicDepositor) != _magicDepositor, "same magicDepositor address");
        magicDepositor = IMagicNftDepositor(_magicDepositor);
        IERC1155Upgradeable(treasure).setApprovalForAll(_magicDepositor, true);
        IERC721Upgradeable(legion).setApprovalForAll(_magicDepositor, true);
        emit MagicDepositorChanged(address(magicDepositor));
    }

    // Depositing NFT 

    function depositLegion(uint256 tokenId) external   {
        require(legion != address(0), "Cannot deposit Legion");
        require(address(magicDepositor) != address(0),"magicDepositor zero address");
       _depositLegion(tokenId);
        emit Deposit(legion, tokenId, 1);
    }

    function withdrawLegion(uint256 tokenId) external   {
        require(legion != address(0), "Cannot Withdraw Legion");
        require(address(magicDepositor) != address(0),"magicDepositor zero address");
        WhichPool whichPool = isPool[msg.sender][tokenId];
        require(whichPool == WhichPool.LegionMainPool || whichPool == WhichPool.LegionReservePool,"No pool assoicated with token id");
        if(whichPool == WhichPool.LegionMainPool){
            _withdrawLegionFromPool(legionMainPool,msg.sender,tokenId);
            // Unstake by magicDepositor
            magicDepositor.unStakeLegion(tokenId);
            // transfer nft token id to user address
            IERC721Upgradeable(legion).transferFrom(address(this),msg.sender, tokenId);
            uint256 len = legionReservePool.userBoosts.length;
            if(len !=0 ){
                // Getting maximum boost in legion reserve pool
                UserBoost[] memory  userBoosts = legionReservePool.userBoosts;
                uint256 index = _getHigherExistingBoost(userBoosts);

                //Remove highest rarity user from reservePool    
                
                UserBoost memory  reservePoolUserBoost = _removeLegionFromPool(legionReservePool,index);
                uint256 addingTokenId = reservePoolUserBoost.tokenId;
                
                //Add above userBoost in mainPool

                IERC721Upgradeable(legion).transferFrom(address(this), address(magicDepositor), addingTokenId);
                magicDepositor.stakeLegion(addingTokenId); 
                _addLegion(legionMainPool,reservePoolUserBoost, WhichPool.LegionMainPool);
            } 
        } 
        else {
            _withdrawLegionFromPool(legionReservePool,msg.sender,tokenId);
            // transfer nft token id to user address
            IERC721Upgradeable(legion).transferFrom(address(this),msg.sender, tokenId);
        } 
        emit Withdrawn(legion, tokenId, 1);
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

    function withdrawTreasure(uint256 tokenId,uint256 amount) external   {
        require(treasure != address(0), "Cannot withdraw Treasure");
        uint256 currReserveAmount = treasureReservePool.stakedPerToken[msg.sender][tokenId];
        uint256 currMainAmount = treasureMainPool.stakedPerToken[msg.sender][tokenId];
        if(currReserveAmount >= amount){
            // withdraw from reserve pool
            _withdrawTreasureFromPool(treasureReservePool,msg.sender,tokenId,amount);
            // transfer nft token id to user address
            IERC1155Upgradeable(treasure).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                amount,
                bytes("")
            );
        }
        else if(currMainAmount >= amount){
            // withdraw from main pool
            _withdrawTreasureFromPool(treasureMainPool,msg.sender,tokenId,amount);
            // Unstake by magicDepositor
            magicDepositor.unStakeTreasure(tokenId,amount);
            // transfer nft token id to user address
            IERC1155Upgradeable(treasure).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                amount,
                bytes("")
            );
            uint256 len = treasureReservePool.userBoosts.length;
            if(len !=0 ){
                // Getting maximum boost in treasure reserve pool
                UserBoost[] memory  userBoosts = treasureReservePool.userBoosts;
                uint256 index = _getHigherExistingBoost(userBoosts);

                //Remove highest rarity user from reservePool    
                
                UserBoost memory  reservePoolUserBoost = _removeTreasureFromPool(treasureReservePool,index);

                uint256 addingTokenId = reservePoolUserBoost.tokenId;
                uint256 tokenAmount = reservePoolUserBoost.amount;
                
                //Add above userBoost in mainPool

                IERC1155Upgradeable(treasure).safeTransferFrom(
                    address(this),
                    address(magicDepositor),
                    addingTokenId,
                    tokenAmount,
                    bytes("")
                );
                magicDepositor.stakeTreasure(addingTokenId,tokenAmount); 
                _addTreasure(treasureMainPool,reservePoolUserBoost);

            } 
        }
        else{
            revert("User don't have enough  treasures");
        }

        emit Withdrawn(treasure, tokenId, amount);
    }
 

    function _depositLegion(uint256 _tokenId) internal{
        uint256 nftBoost = _getBoost(legion,_tokenId,1);
        bool isLegion1_1Staked = _checkLegion1Staked();
        if(isLegion1_1Staked){
            _addToLegionPool(_tokenId,nftBoost,WhichPool.LegionReservePool);
            return;
        }
        if(legionMainPoolLength() < 3 ){
            _addToLegionPool(_tokenId,nftBoost,WhichPool.LegionMainPool);
        } 
        else{
            (bool find,int256 findIndex )= _getLowerExistingBoost(legionMainPool.userBoosts,nftBoost,1);
            if(find){
                // Removing lower rarity legion nft from mainLegionPool
                UserBoost memory removingUserBoost = _removeLegionFromPool(legionMainPool,uint256(findIndex));
                
                uint256 removedTokenId = removingUserBoost.tokenId; 
                magicDepositor.unStakeLegion(removedTokenId);

                // Adding removed nft , to reserveLegionPool

                _addLegion(legionReservePool,removingUserBoost, WhichPool.LegionReservePool); 

                // Adding upcomming Higher rarity NFT to mainLegionPool
                _addToLegionPool(_tokenId,nftBoost,WhichPool.LegionMainPool);
            }
            else{
                // Add Nft to reserve pool
                _addToLegionPool(_tokenId,nftBoost,WhichPool.LegionReservePool);
            }
        }
    }

    function _depositTreasures(uint256 _tokenId,uint256 _amount) internal{
        uint256 nftBoost = _getBoost(treasure,_tokenId,_amount);       
        if(treasureInMainPool() < 20 ){
            _addToTreasurePool(_tokenId,nftBoost,_amount,WhichPool.TreasureMainPool);
        }  
        else{
            (bool find,int256 findIndex) = _getLowerExistingBoost(treasureMainPool.userBoosts,nftBoost,_amount);
            if(find){
                UserBoost[] storage userBoosts  = treasureMainPool.userBoosts;
                UserBoost memory userBoost = userBoosts[uint256(findIndex)];
                // address user = userBoost.user;
                uint256 removedTokenAmount = userBoost.amount;
                uint256 removedTokenId = userBoost.tokenId;

                UserBoost memory removingUserBoost = _removeTreasureFromPool(treasureMainPool,uint256(findIndex));

                magicDepositor.unStakeTreasure(removedTokenId,removedTokenAmount);

                // Adding removed nft , to reserveLegionPool
                _addTreasure(treasureReservePool,removingUserBoost); 

                // Adding upcomming Higher rarity NFT to mainTreasurePool
               _addToTreasurePool(_tokenId,nftBoost,_amount,WhichPool.TreasureMainPool);
            }
            else{
                // Add Nft to reserve pool
                _addToTreasurePool(_tokenId,nftBoost,_amount,WhichPool.TreasureReservePool);
            }
        }
    }


    function _addToLegionPool(uint256 _tokenId,uint256 _nftBoost,WhichPool whichPool) internal{
        UserBoost memory userBoost = UserBoost(msg.sender,_nftBoost,block.timestamp,_tokenId,1);
        if(whichPool == WhichPool.LegionMainPool){
            IERC721Upgradeable(legion).transferFrom(msg.sender, address(magicDepositor), _tokenId);
            magicDepositor.stakeLegion(_tokenId); 
            _addLegion(legionMainPool,userBoost,whichPool);  
        }
        else if(whichPool == WhichPool.LegionReservePool){
            IERC721Upgradeable(legion).transferFrom(msg.sender, address(this), _tokenId);
            _addLegion(legionReservePool,userBoost,whichPool);  
        }
        else{
            revert("Allowing only MainPool and ReservePool");
        }    
    }

    function _addToTreasurePool(uint256 _tokenId,uint256 _nftBoost,uint256 _amount,WhichPool whichPool) internal{
        UserBoost memory userBoost = UserBoost(msg.sender,_nftBoost,block.timestamp,_tokenId,1);
        if(whichPool == WhichPool.TreasureMainPool){
            IERC1155Upgradeable(treasure).safeTransferFrom(
                msg.sender,
                address(magicDepositor),
                _tokenId,
                _amount,
                bytes("")
            );
            magicDepositor.stakeTreasure(_tokenId,_amount); 
            _addTreasure(treasureMainPool,userBoost);  
        }
        else if(whichPool == WhichPool.TreasureReservePool){
            IERC1155Upgradeable(treasure).safeTransferFrom(
                msg.sender,
                address(this),
                _tokenId,
                _amount,
                bytes("")
            );
            _addTreasure(treasureReservePool,userBoost);   
        }
        else{
            revert("Allowing only MainPool and ReservePool");
        }  
    }

    function _addLegion(LegionPool storage pool,UserBoost memory userBoost,WhichPool whichPool) internal{
        uint256 tokenId = userBoost.tokenId;
        address user = userBoost.user;

        pool.userBoosts.push(userBoost);
        pool.userIndex[tokenId] = pool.userBoosts.length - 1;
        pool.deposits.add(tokenId);
        isPool[user][tokenId] = whichPool;
    }

    function _addTreasure(TreasurePool storage pool,UserBoost memory userBoost) internal{
        uint256 tokenId = userBoost.tokenId;
        address user = userBoost.user;
        uint256 amount = userBoost.amount;
        pool.userBoosts.push(userBoost);
        uint256 userBoostlength = pool.userBoosts.length-1; 
        pool.deposits += amount;
        pool.stakedPerToken[user][tokenId] += amount;
        pool.userIndex[user][tokenId][amount].push(userBoostlength);
    }

    function _withdrawLegionFromPool(LegionPool storage legionPool,address user,uint256 _tokenId) internal{
        uint256 index = legionPool.userIndex[_tokenId];
        UserBoost storage userBoost  = legionPool.userBoosts[index];
        require(user == userBoost.user ,"Invalid owner");
        require(_tokenId == userBoost.tokenId,"Invalid Token Id");
        // remove legion from mainPool
        _removeLegionFromPool(legionPool,index);
        isPool[msg.sender][_tokenId] = WhichPool.None;
    }

    function _withdrawTreasureFromPool(TreasurePool storage treasurePool,address _user,uint256 _tokenId,uint256 _amount) internal{
        uint256[] memory indexTreausres = treasurePool.userIndex[_user][_tokenId][_amount];
        uint256 userBoostIndex = indexTreausres[indexTreausres.length-1];

        UserBoost[] storage userBoosts  = treasurePool.userBoosts;

        UserBoost storage userBoost  = userBoosts[userBoostIndex];
        require(_user == userBoost.user ,"Invalid owner");
        require(_tokenId == userBoost.tokenId,"Invalid Token Id");
        require(_amount == userBoost.amount,"Invalid amount");
        // remove treasure from mainPool
        _removeTreasureFromPool(treasurePool,userBoostIndex);
    }

    function _removeLegionFromPool(LegionPool storage pool,uint256 _findIndex)internal returns(UserBoost memory removedUserBoost){ 
        UserBoost[] storage userBoosts = pool.userBoosts;
        removedUserBoost = userBoosts[_findIndex];
        uint256 removedTokenId = removedUserBoost.tokenId ;
        userBoosts[_findIndex] = userBoosts[userBoosts.length - 1];
        userBoosts.pop();
        pool.deposits.remove(removedTokenId);
        delete pool.userIndex[removedTokenId];
    }

    function _removeTreasureFromPool(TreasurePool storage pool,uint256 _indexUserBoost)internal returns( UserBoost memory removedUserBoost){ 
        UserBoost[] storage userBoosts = pool.userBoosts;
        removedUserBoost = userBoosts[_indexUserBoost];
        uint256 tokenId = removedUserBoost.tokenId;
        uint256 amount = removedUserBoost.amount;
        address user = removedUserBoost.user;
        userBoosts[_indexUserBoost] = userBoosts[userBoosts.length - 1];
        userBoosts.pop();
        pool.deposits -= amount;
        pool.stakedPerToken[user][tokenId] -= amount;
        uint256[] storage userIndexes = pool.userIndex[user][tokenId][amount];
        userIndexes.pop();
   }
 

     // will return true/false and array index 
    // true if we find higher boost than existing 
    // false if we don't find higher boost than exiting 

    function _getLowerExistingBoost(UserBoost[] memory userBoosts,uint256 _currentNftBoost,uint256 _currentAmount) internal pure returns(bool,int256 index){
        uint256 len = userBoosts.length;
        if(len == 0)
        return (false,-1);
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

    function _getHigherExistingBoost(UserBoost[] memory userBoosts) internal pure returns(uint256 index){
        uint256 len = userBoosts.length;
       
        uint256  maxBoost = userBoosts[0].boost;
        for(uint256 i=0; i< len;i++){
            uint256 currentUserBoost = userBoosts[i].boost;
            //uint256 currentUserAmount = userBoosts[i].amount;
            if( maxBoost < currentUserBoost){
               maxBoost = currentUserBoost;
               index = i;
            }
        }
        uint256  maxDepositedtime = type(uint256).max;
        for(uint256 i=0; i< len;i++){
            if(userBoosts[i].boost == maxBoost){
                uint256  currentMaxDepositedtime = userBoosts[i].nftDepositedTime;
                if(maxDepositedtime > currentMaxDepositedtime){
                    maxDepositedtime = currentMaxDepositedtime;
                    index = i;
                }
            }
        }
        return index;
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

