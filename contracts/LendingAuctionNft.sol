// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import {IMagicNftDepositor, IPreciousChef} from "./Interfaces.sol";
import "./MAGIC/IAtlasMine.sol";

/// @title LendingAuctionNft
/// @notice nft lending auction for boosting rewards by staking to magicDepositor
contract LendingAuctionNft is Initializable, OwnableUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;

    uint8 public constant TOTAL_TREASURES = 20;
    uint8 public constant TOTAL_LEGIONS = 3;

    address public treasure; //treasure erc1155 nft in atlasmine
    address public legion; //legion erc721 nft in atlasmine
    IAtlasMine public atlasmine; //AtlasMine contract
    IMagicNftDepositor public magicDepositor; //magicDepositor contract
    IPreciousChef public preciousChef; //PreciousChef contract

    struct UserBoost {
        address user;
        uint256 boost;
        uint256 nftDepositedTime;
        uint256 tokenId;
        uint256 amount;
    }

    struct LegionPool {
        uint256 pid; // pid of PreciousChef
        //Legion Nft to total Staked
        EnumerableSetUpgradeable.UintSet deposits;
        UserBoost[] userBoosts; //All added boost
        mapping(uint256 => uint256) userIndex;
    }

    struct TreasurePool {
        uint256 pid; // pid of PreciousChef
        //totalStaked
        uint256 deposits;
        //  tokenId => total Staked Treasure
        // mapping(uint256 => uint256) stakedTreasurePerTokenId;
        UserBoost[] userBoosts; //All added boost
        // user => tokenId => stakedAmount
        mapping(address => mapping(uint256 => uint256)) stakedPerToken;
        // user => tokenId => amount => Index []
        mapping(address => mapping(uint256 => mapping(uint256 => uint256[]))) userIndex;
    }

    LegionPool legionMainPool;
    LegionPool legionReservePool;
    TreasurePool treasureMainPool;
    TreasurePool treasureReservePool;
    enum WhichPool {
        None,
        LegionMainPool,
        LegionReservePool,
        TreasureMainPool,
        TreasureReservePool
    }
    // User => TokenId => WhichPool
    mapping(address => mapping(uint256 => WhichPool)) isPool;

    // EVENTS

    event Deposit(address nft, uint256 tokenId, uint256 amount);
    event Withdrawn(address nft, uint256 tokenId, uint256 amount);
    event MagicDepositorChanged(address magicDepositor);
    event SetPreciousChef(address preciousChef);

    function initialize(
        address _treasure,
        address _legion,
        address _atlasMine
    ) external initializer {
        __Ownable_init_unchained();
        treasure = _treasure;
        legion = _legion;
        atlasmine = IAtlasMine(_atlasMine);

        // init pid
        legionMainPool.pid = 0;
        legionReservePool.pid = 1;
        treasureMainPool.pid = 2;
        treasureReservePool.pid = 3;
    }

    /// @notice setting magicDepositor contract
    /// @param _magicDepositor magicDepositor contract address

    function setMagicDepositor(address _magicDepositor) external onlyOwner {
        require(_magicDepositor != address(0), "magicDepositor zero address");
        require(address(magicDepositor) != _magicDepositor, "same magicDepositor address");
        // Removing approval for previous magicDepositor address
        IERC1155Upgradeable(treasure).setApprovalForAll(address(magicDepositor), false);
        IERC721Upgradeable(legion).setApprovalForAll(address(magicDepositor), false);
        magicDepositor = IMagicNftDepositor(_magicDepositor);
        // Granting approval for new magicDepositor address
        IERC1155Upgradeable(treasure).setApprovalForAll(_magicDepositor, true);
        IERC721Upgradeable(legion).setApprovalForAll(_magicDepositor, true);
        emit MagicDepositorChanged(address(magicDepositor));
    }

    /// @notice Set PreciousChef address
    /// @param _preciousChef PreciousChef contract address
    function setPreciousChef(address _preciousChef) external onlyOwner {
        require(_preciousChef != address(0), "Invalid PreciousChef address");

        preciousChef = IPreciousChef(_preciousChef);
        emit SetPreciousChef(_preciousChef);
    }

    /// @notice depositing legion nft
    /// @param tokenId legion tokenId

    function depositLegion(uint256 tokenId) external {
        require(legion != address(0), "Cannot deposit Legion");
        require(address(magicDepositor) != address(0), "magicDepositor zero address");
        _depositLegion(tokenId);
        emit Deposit(legion, tokenId, 1);
    }

    /// @notice Withdrawing legion nft
    /// @param tokenId legion tokenId

    function withdrawLegion(uint256 tokenId) external {
        require(legion != address(0), "Cannot Withdraw Legion");
        require(address(magicDepositor) != address(0), "magicDepositor zero address");
        WhichPool whichPool = isPool[msg.sender][tokenId];
        require(
            whichPool == WhichPool.LegionMainPool || whichPool == WhichPool.LegionReservePool,
            "No pool assoicated with token id"
        );
        if (whichPool == WhichPool.LegionMainPool) {
            _withdrawLegionFromPool(legionMainPool, msg.sender, tokenId);
            // Unstake by magicDepositor
            magicDepositor.unStakeLegion(tokenId);
            uint256 len = legionReservePool.userBoosts.length;
            if (len != 0) {
                // Getting maximum boost in legion reserve pool
                UserBoost[] memory userBoosts = legionReservePool.userBoosts;
                uint256 index = _getHigherExistingBoost(userBoosts);

                //Remove highest rarity user from reservePool

                UserBoost memory reservePoolUserBoost = _removeLegionFromPool(
                    legionReservePool,
                    index
                );
                uint256 addingTokenId = reservePoolUserBoost.tokenId;

                //Add above userBoost in mainPool

                IERC721Upgradeable(legion).transferFrom(
                    address(this),
                    address(magicDepositor),
                    addingTokenId
                );
                magicDepositor.stakeLegion(addingTokenId);
                _addLegion(legionMainPool, reservePoolUserBoost, WhichPool.LegionMainPool);
            }
            // transfer nft token id to user address
            IERC721Upgradeable(legion).transferFrom(address(this), msg.sender, tokenId);
        } else {
            _withdrawLegionFromPool(legionReservePool, msg.sender, tokenId);
            // transfer nft token id to user address
            IERC721Upgradeable(legion).transferFrom(address(this), msg.sender, tokenId);
        }
        emit Withdrawn(legion, tokenId, 1);
    }

    /// @notice depositing Treasures nft
    /// @param tokenId Treasure tokenId
    /// @param amount Treasure amount

    function depositTreasures(uint256 tokenId, uint256 amount) external {
        require(treasure != address(0), "Cannot deposit Treasure");
        require(amount > 0, "Amount is 0");
        uint256 leftTreasureInMainPool = TOTAL_TREASURES -
            treasureInPool(WhichPool.TreasureMainPool);
        if (leftTreasureInMainPool != 0)
            amount = amount > leftTreasureInMainPool ? leftTreasureInMainPool : amount;
        _depositTreasures(tokenId, amount);
        emit Deposit(treasure, tokenId, amount);
    }

    /// @notice withdrawing Treasures nft
    /// @param tokenId Treasure tokenId
    /// @param amount Treasure amount

    function withdrawTreasure(uint256 tokenId, uint256 amount) external {
        require(treasure != address(0), "Cannot withdraw Treasure");
        require(amount > 0, "Amount is 0");
        uint256 currReserveAmount = treasureReservePool.stakedPerToken[msg.sender][tokenId];
        uint256 currMainAmount = treasureMainPool.stakedPerToken[msg.sender][tokenId];
        if (currReserveAmount >= amount) {
            // withdraw from reserve pool
            _withdrawTreasureFromPool(treasureReservePool, msg.sender, tokenId, amount);
            // transfer nft token id to user address
            IERC1155Upgradeable(treasure).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                amount,
                bytes("")
            );
        } else if (currMainAmount >= amount) {
            // withdraw from main pool
            _withdrawTreasureFromPool(treasureMainPool, msg.sender, tokenId, amount);
            // Unstake by magicDepositor
            magicDepositor.unStakeTreasure(tokenId, amount);
            uint256 len = treasureReservePool.userBoosts.length;
            if (len != 0) {
                // Getting maximum boost in treasure reserve pool
                UserBoost[] memory userBoosts = treasureReservePool.userBoosts;
                uint256 index = _getHigherExistingBoost(userBoosts);

                //Remove highest rarity user from reservePool

                UserBoost memory reservePoolUserBoost = _removeTreasureFromPool(
                    treasureReservePool,
                    index
                );

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
                magicDepositor.stakeTreasure(addingTokenId, tokenAmount);
                _addTreasure(treasureMainPool, reservePoolUserBoost);
            }
            // transfer nft token id to user address
            IERC1155Upgradeable(treasure).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                amount,
                bytes("")
            );
        } else {
            revert("User don't have enough  treasures");
        }

        emit Withdrawn(treasure, tokenId, amount);
    }

    function _depositLegion(uint256 _tokenId) internal {
        uint256 nftBoost = _getBoost(legion, _tokenId, 1);
        bool isLegion1_1Staked = _checkLegion1Staked();
        if (isLegion1_1Staked) {
            _addToLegionPool(_tokenId, nftBoost, WhichPool.LegionReservePool);
            return;
        }
        uint256 legionMainPoolLength = legionPoolTokenIds(WhichPool.LegionMainPool).length;
        if (legionMainPoolLength < TOTAL_LEGIONS) {
            _addToLegionPool(_tokenId, nftBoost, WhichPool.LegionMainPool);
        } else {
            (bool find, int256 findIndex) = _getLowerExistingBoost(
                legionMainPool.userBoosts,
                nftBoost,
                1
            );
            if (!find) {
                // Add Nft to reserve pool
                _addToLegionPool(_tokenId, nftBoost, WhichPool.LegionReservePool);
                return;
            }
            // Otherwise
            // Removing lower rarity legion nft from mainLegionPool
            UserBoost memory removingUserBoost = _removeLegionFromPool(
                legionMainPool,
                uint256(findIndex)
            );

            uint256 removedTokenId = removingUserBoost.tokenId;
            magicDepositor.unStakeLegion(removedTokenId);

            // Adding removed nft , to reserveLegionPool

            _addLegion(legionReservePool, removingUserBoost, WhichPool.LegionReservePool);

            // Adding upcomming Higher rarity NFT to mainLegionPool
            _addToLegionPool(_tokenId, nftBoost, WhichPool.LegionMainPool);
        }
    }

    function _depositTreasures(uint256 _tokenId, uint256 _amount) internal {
        uint256 nftBoost = _getBoost(treasure, _tokenId, _amount);
        uint256 treasureInMainPool = treasureInPool(WhichPool.TreasureMainPool);
        if (treasureInMainPool < TOTAL_TREASURES) {
            _addToTreasurePool(_tokenId, nftBoost, _amount, WhichPool.TreasureMainPool);
        } else {
            (bool find, int256 findIndex) = _getLowerExistingBoost(
                treasureMainPool.userBoosts,
                nftBoost,
                _amount
            );
            if (!find) {
                // Add Nft to reserve pool
                _addToTreasurePool(_tokenId, nftBoost, _amount, WhichPool.TreasureReservePool);
                return;
            }
            // Otherwise
            // Removing lower rarity trasure nft from mainTreasurePool
            UserBoost[] storage userBoosts = treasureMainPool.userBoosts;
            UserBoost memory userBoost = userBoosts[uint256(findIndex)];
            // address user = userBoost.user;
            uint256 removedTokenAmount = userBoost.amount;
            uint256 removedTokenId = userBoost.tokenId;

            UserBoost memory removingUserBoost = _removeTreasureFromPool(
                treasureMainPool,
                uint256(findIndex)
            );

            magicDepositor.unStakeTreasure(removedTokenId, removedTokenAmount);

            // Adding removed nft , to reserveLegionPool
            _addTreasure(treasureReservePool, removingUserBoost);

            // Adding upcomming Higher rarity NFT to mainTreasurePool
            _addToTreasurePool(_tokenId, nftBoost, _amount, WhichPool.TreasureMainPool);
        }
    }

    function _addToLegionPool(
        uint256 _tokenId,
        uint256 _nftBoost,
        WhichPool whichPool
    ) internal {
        UserBoost memory userBoost = UserBoost(msg.sender, _nftBoost, block.timestamp, _tokenId, 1);
        if (whichPool == WhichPool.LegionMainPool) {
            IERC721Upgradeable(legion).transferFrom(msg.sender, address(magicDepositor), _tokenId);
            magicDepositor.stakeLegion(_tokenId);
            _addLegion(legionMainPool, userBoost, whichPool);
        } else if (whichPool == WhichPool.LegionReservePool) {
            IERC721Upgradeable(legion).transferFrom(msg.sender, address(this), _tokenId);
            _addLegion(legionReservePool, userBoost, whichPool);
        } else {
            revert("Allowing only MainPool and ReservePool");
        }
    }

    function _addToTreasurePool(
        uint256 _tokenId,
        uint256 _nftBoost,
        uint256 _amount,
        WhichPool whichPool
    ) internal {
        UserBoost memory userBoost = UserBoost(
            msg.sender,
            _nftBoost,
            block.timestamp,
            _tokenId,
            _amount
        );
        if (whichPool == WhichPool.TreasureMainPool) {
            IERC1155Upgradeable(treasure).safeTransferFrom(
                msg.sender,
                address(magicDepositor),
                _tokenId,
                _amount,
                bytes("")
            );
            magicDepositor.stakeTreasure(_tokenId, _amount);
            _addTreasure(treasureMainPool, userBoost);
        } else if (whichPool == WhichPool.TreasureReservePool) {
            IERC1155Upgradeable(treasure).safeTransferFrom(
                msg.sender,
                address(this),
                _tokenId,
                _amount,
                bytes("")
            );
            _addTreasure(treasureReservePool, userBoost);
        } else {
            revert("Allowing only MainPool and ReservePool");
        }
    }

    function _addLegion(
        LegionPool storage pool,
        UserBoost memory userBoost,
        WhichPool whichPool
    ) internal {
        uint256 tokenId = userBoost.tokenId;
        address user = userBoost.user;

        pool.userBoosts.push(userBoost);
        pool.userIndex[tokenId] = pool.userBoosts.length - 1;
        pool.deposits.add(tokenId);
        isPool[user][tokenId] = whichPool;

        preciousChef.deposit(pool.pid, userBoost.boost, user);
    }

    function _addTreasure(TreasurePool storage pool, UserBoost memory userBoost) internal {
        uint256 tokenId = userBoost.tokenId;
        address user = userBoost.user;
        uint256 amount = userBoost.amount;
        pool.userBoosts.push(userBoost);
        uint256 userBoostlength = pool.userBoosts.length - 1;
        pool.deposits += amount;
        pool.stakedPerToken[user][tokenId] += amount;
        pool.userIndex[user][tokenId][amount].push(userBoostlength);

        preciousChef.deposit(pool.pid, userBoost.boost, user);
    }

    function _withdrawLegionFromPool(
        LegionPool storage legionPool,
        address user,
        uint256 _tokenId
    ) internal {
        uint256 index = legionPool.userIndex[_tokenId];
        UserBoost storage userBoost = legionPool.userBoosts[index];
        require(user == userBoost.user, "Invalid owner");
        require(_tokenId == userBoost.tokenId, "Invalid Token Id");
        // remove legion from mainPool
        _removeLegionFromPool(legionPool, index);
        isPool[msg.sender][_tokenId] = WhichPool.None;
    }

    function _withdrawTreasureFromPool(
        TreasurePool storage treasurePool,
        address _user,
        uint256 _tokenId,
        uint256 _amount
    ) internal {
        uint256[] memory indexTreausres = treasurePool.userIndex[_user][_tokenId][_amount];
        uint256 indexTreausresLen = indexTreausres.length;
        require(indexTreausresLen > 0, "Provide Exact amount");
        uint256 userBoostIndex = indexTreausres[indexTreausres.length - 1];

        UserBoost[] storage userBoosts = treasurePool.userBoosts;

        UserBoost storage userBoost = userBoosts[userBoostIndex];
        require(_user == userBoost.user, "Invalid owner");
        require(_tokenId == userBoost.tokenId, "Invalid Token Id");
        require(_amount == userBoost.amount, "Invalid amount");
        // remove treasure from mainPool
        _removeTreasureFromPool(treasurePool, userBoostIndex);
    }

    function _removeLegionFromPool(LegionPool storage pool, uint256 _findIndex)
        internal
        returns (UserBoost memory removedUserBoost)
    {
        UserBoost[] storage userBoosts = pool.userBoosts;
        removedUserBoost = userBoosts[_findIndex];
        uint256 removedTokenId = removedUserBoost.tokenId;
        userBoosts[_findIndex] = userBoosts[userBoosts.length - 1];
        pool.userIndex[userBoosts[userBoosts.length - 1].tokenId] = _findIndex;
        userBoosts.pop();
        pool.deposits.remove(removedTokenId);
        delete pool.userIndex[removedTokenId];

        preciousChef.withdraw(pool.pid, removedUserBoost.boost, removedUserBoost.user);
    }

    function _removeTreasureFromPool(TreasurePool storage pool, uint256 _indexUserBoost)
        internal
        returns (UserBoost memory removedUserBoost)
    {
        UserBoost[] storage userBoosts = pool.userBoosts;
        removedUserBoost = userBoosts[_indexUserBoost];
        uint256 tokenId = removedUserBoost.tokenId;
        uint256 amount = removedUserBoost.amount;
        address user = removedUserBoost.user;

        userBoosts[_indexUserBoost] = userBoosts[userBoosts.length - 1];

        address replacedUser = userBoosts[_indexUserBoost].user;
        uint256 replacedTokenId = userBoosts[_indexUserBoost].tokenId;
        uint256 replacedAmount = userBoosts[_indexUserBoost].amount;
        pool.userIndex[replacedUser][replacedTokenId][replacedAmount].pop();
        pool.userIndex[replacedUser][replacedTokenId][replacedAmount].push(_indexUserBoost);
        userBoosts.pop();
        pool.deposits -= amount;
        pool.stakedPerToken[user][tokenId] -= amount;
        uint256[] storage userIndexes = pool.userIndex[user][tokenId][amount];
        userIndexes.pop();

        preciousChef.withdraw(pool.pid, removedUserBoost.boost, removedUserBoost.user);
    }

    // will return true/false and array index
    // true if we find higher boost than existing
    // false if we don't find higher boost than exiting

    function _getLowerExistingBoost(
        UserBoost[] memory userBoosts,
        uint256 _currentNftBoost,
        uint256 _currentAmount
    ) internal pure returns (bool, int256 index) {
        uint256 len = userBoosts.length;
        if (len == 0) return (false, -1);
        uint256 minBoost = userBoosts[0].boost;
        uint256 minDepositedTime = 0;
        for (uint256 i = 0; i < len; i++) {
            uint256 currentUserBoost = userBoosts[i].boost;
            uint256 currentUserAmount = userBoosts[i].amount;
            uint256 currentMinDepositedtime = userBoosts[i].nftDepositedTime;

            if (_currentAmount <= currentUserAmount) {
                if (minBoost == currentUserBoost && minDepositedTime < currentMinDepositedtime) {
                    minDepositedTime = currentMinDepositedtime;
                    index = int256(i);
                }

                if (minBoost > currentUserBoost) {
                    minBoost = currentUserBoost;
                    index = int256(i);
                    minDepositedTime = currentMinDepositedtime;
                }
            }
        }
        if (_currentNftBoost > minBoost) return (true, index);
        else return (false, -1);
    }

    // return higher existing userBoost array index

    function _getHigherExistingBoost(UserBoost[] memory userBoosts)
        internal
        pure
        returns (uint256 index)
    {
        uint256 len = userBoosts.length;

        uint256 maxBoost = userBoosts[0].boost;
        uint256 maxDepositedtime = type(uint256).max;
        for (uint256 i = 0; i < len; i++) {
            uint256 currentUserBoost = userBoosts[i].boost;
            uint256 currentMaxDepositedtime = userBoosts[i].nftDepositedTime;
            //uint256 currentUserAmount = userBoosts[i].amount;

            if (maxBoost == currentUserBoost && maxDepositedtime > currentMaxDepositedtime) {
                maxDepositedtime = currentMaxDepositedtime;
                index = i;
            }

            if (maxBoost < currentUserBoost) {
                maxBoost = currentUserBoost;
                index = i;
                maxDepositedtime = currentMaxDepositedtime;
            }
        }
        return index;
    }

    function _getBoost(
        address _nft,
        uint256 _tokenId,
        uint256 _amount
    ) internal view returns (uint256) {
        return atlasmine.getNftBoost(_nft, _tokenId, _amount);
    }

    // check if magicDepositor already staked Legion1_1

    function _checkLegion1Staked() internal view returns (bool) {
        bool isLegion1_1Staked = atlasmine.isLegion1_1Staked(address(magicDepositor));
        return isLegion1_1Staked;
    }

    /// @notice getting all tokenIds present in legionMainPool and legionReservePool
    /// @param whichPool whichPool : LegionMainPool and LegionReservePool

    function legionPoolTokenIds(WhichPool whichPool) public view returns (uint256[] memory) {
        if (whichPool == WhichPool.LegionMainPool) return legionMainPool.deposits.values();
        else if (whichPool == WhichPool.LegionReservePool)
            return legionReservePool.deposits.values();
    }

    /// @notice getting all tokenIds present in legionMainPool and legionReservePool
    /// @param user address of user
    /// @param tokenId legion tokenId

    function getUserLegionData(address user, uint256 tokenId)
        public
        view
        returns (UserBoost memory)
    {
        WhichPool whichPool = isPool[user][tokenId];
        uint256 userIndex;
        if (whichPool == WhichPool.LegionMainPool) {
            userIndex = legionMainPool.userIndex[tokenId];
            return legionMainPool.userBoosts[userIndex];
        } else if (whichPool == WhichPool.LegionReservePool) {
            userIndex = legionReservePool.userIndex[tokenId];
            return legionReservePool.userBoosts[userIndex];
        }
    }

    /// @notice getting user treasure data at index
    /// @param whichPool whichPool : TreasureMainPool and TreasureReservePool
    /// @param index array index

    function getUserTreasureData(WhichPool whichPool, uint256 index)
        public
        view
        returns (UserBoost memory)
    {
        if (whichPool == WhichPool.TreasureMainPool) {
            if (treasureMainPool.userBoosts.length >= index + 1)
                return treasureMainPool.userBoosts[index];
        } else if (whichPool == WhichPool.TreasureReservePool) {
            if (treasureReservePool.userBoosts.length >= index + 1)
                return treasureReservePool.userBoosts[index];
        }
    }

    /// @notice getting all treasure userBoosts indexes array
    /// @param user address of user
    /// @param tokenId legion tokenId
    /// @param amount amount of treasure token

    function getUserIndexTreasureBoosts(
        address user,
        uint256 tokenId,
        uint256 amount
    ) public view returns (uint256[] memory) {
        uint256 currReserveAmount = treasureReservePool.stakedPerToken[user][tokenId];
        uint256 currMainAmount = treasureMainPool.stakedPerToken[user][tokenId];

        if (currReserveAmount >= amount) {
            return treasureReservePool.userIndex[user][tokenId][amount];
        } else if (currMainAmount >= amount) {
            return treasureMainPool.userIndex[user][tokenId][amount];
        }
    }

    /// @notice getting all userBoosts present in legionMainPool and legionReservePool

    function getLegionUserBoosts() public view returns (UserBoost[] memory, UserBoost[] memory) {
        return (legionMainPool.userBoosts, legionReservePool.userBoosts);
    }

    /// @notice getting all userBoosts present in treasureMainPool and treasureReservePool

    function getTreasureUserBoosts() public view returns (UserBoost[] memory, UserBoost[] memory) {
        return (treasureMainPool.userBoosts, treasureReservePool.userBoosts);
    }

    /// @notice getting all deposits in TreasureMainPool/TreasureReservePool
    /// @param whichPool whichPool : TreasureMainPool and TreasureReservePool

    function treasureInPool(WhichPool whichPool) public view returns (uint256) {
        if (whichPool == WhichPool.TreasureMainPool) return treasureMainPool.deposits;
        else if (whichPool == WhichPool.TreasureReservePool) return treasureReservePool.deposits;
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
