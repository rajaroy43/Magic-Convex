// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

/// @title PreciousChef
/// @notice Give PRECIOUS incentives to the Magic NFT lenders
/// @dev There would be 4 pools initially
/// pid 0: Legion Main Pool
/// pid 1: Legion Reserve Pool
/// pid 2: Treasure Main Pool
/// pid 3: Treasure Reserve Pool
/// deposit/withdraw functions are only callable my the LendAuction contract
contract PreciousChef is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /** Structs */

    /// @notice Info of each user.
    /// `boost` boost of nfts the user has provided.
    /// `rewardDebt` The amount of PRECIOUS entitled to the user.
    struct UserInfo {
        uint256 boost;
        int256 rewardDebt;
    }

    /// @notice Info of each pool.
    /// `allocPoint` The amount of allocation points assigned to the pool.
    /// `boostSupply` boost of nfts provided to the pool.
    struct PoolInfo {
        uint128 accPreciousPerBoost;
        uint64 lastRewardBlock;
        uint64 allocPoint;
        uint256 boostSupply;
    }

    /** Constants */
    uint256 private constant ACC_PRECIOUS_PRECISION = 1e12;

    /** State variables */

    /// @notice Address of PRECIOUS contract.
    IERC20Upgradeable public precious;

    /// @notice Info of each pool.
    PoolInfo[] public poolInfo;

    /// @notice Address of LendAuction contract.
    address public lendAuction;

    /// @notice Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;

    /// @notice PRECIOUS reward amount per block
    uint256 public preciousPerBlock;

    /// @notice Info of each user.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    event AddPool(uint256 indexed pid, uint256 allocPoint);
    event SetPool(uint256 indexed pid, uint256 allocPoint);
    event Deposit(uint256 indexed pid, address indexed user, uint256 boost);
    event Withdraw(uint256 indexed pid, address indexed user, uint256 boost);
    event Harvest(uint256 indexed pid, address indexed from, address to, uint256 amount);
    event UpdatePool(uint256 indexed pid, uint256 accPreciousPerBoost);

    modifier onlyLendAuction() {
        require(msg.sender == lendAuction, "Not lend auction");
        _;
    }

    function initialize(
        address _precious,
        uint256 _preciousPerBlock,
        address _lendAuction
    ) external initializer {
        __Ownable_init();

        precious = IERC20Upgradeable(_precious);
        preciousPerBlock = _preciousPerBlock;
        lendAuction = _lendAuction;
    }

    /** Owner functions */

    /// @notice Add a new pool. Can only be called by the owner.
    /// @param allocPoint AP of the new pool.
    function addPool(uint256 allocPoint) public onlyOwner {
        uint256 lastRewardBlock = block.number;
        totalAllocPoint += allocPoint;
        uint256 pid = poolInfo.length;

        poolInfo.push(
            PoolInfo({
                allocPoint: uint64(allocPoint),
                lastRewardBlock: uint64(lastRewardBlock),
                accPreciousPerBoost: 0,
                boostSupply: 0
            })
        );

        emit AddPool(pid, allocPoint);
    }

    /// @notice Update the given pool's  allocation point. Can only be called by the owner.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param allocPoint New AP of the pool.
    /// @param withUpdate Call `updatePool` fcn first if true.
    function set(
        uint256 pid,
        uint256 allocPoint,
        bool withUpdate
    ) public onlyOwner {
        require(pid < poolInfo.length, "Invalid pid");

        if (withUpdate) {
            updatePool(pid);
        }

        totalAllocPoint = totalAllocPoint - poolInfo[pid].allocPoint + allocPoint;
        poolInfo[pid].allocPoint = uint64(allocPoint);

        emit SetPool(pid, allocPoint);
    }

    /// @notice Deposit nftBoost to the pool for PRECIOUS allocation. Can only be called by the lendAuction contract
    /// @dev The LendAuction contract calls this function
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param nftBoost boost of nft to deposit.
    /// @param to The user that receives `nftBoost` deposit.
    function deposit(
        uint256 pid,
        uint256 nftBoost,
        address to
    ) external onlyLendAuction {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][to];

        // Effects
        pool.boostSupply += nftBoost;
        user.boost += nftBoost;
        user.rewardDebt =
            user.rewardDebt +
            int256((nftBoost * pool.accPreciousPerBoost) / ACC_PRECIOUS_PRECISION);
        poolInfo[pid] = pool;

        emit Deposit(pid, to, nftBoost);
    }

    /// @notice Withdraw nftBoost from the pool. Can only be called by the lendAuction contract
    /// @dev The LendAuction contract calls this function
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param nftBoost boost of nft to withdraw.
    /// @param from The user that lose the `nftBoost`
    function withdraw(
        uint256 pid,
        uint256 nftBoost,
        address from
    ) external onlyLendAuction {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][from];

        // Effects
        user.rewardDebt =
            user.rewardDebt -
            int256((nftBoost * pool.accPreciousPerBoost) / ACC_PRECIOUS_PRECISION);
        user.boost -= nftBoost;
        pool.boostSupply -= nftBoost;
        poolInfo[pid] = pool;

        emit Withdraw(pid, from, nftBoost);
    }

    /** USER EXPOSED FUNCTIONS */
    /// @notice Update reward variables for all pools. Be careful of gas spending!
    /// @param pids Pool IDs of all to be updated. Make sure to update all active pools.
    function massUpdatePools(uint256[] calldata pids) external {
        uint256 len = pids.length;
        for (uint256 i = 0; i < len; ++i) {
            updatePool(pids[i]);
        }
    }

    /// @notice Update reward variables of the given pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @return pool Returns the pool that was updated.
    function updatePool(uint256 pid) public returns (PoolInfo memory pool) {
        pool = poolInfo[pid];
        if (block.number > pool.lastRewardBlock) {
            uint256 boostSupply = poolInfo[pid].boostSupply;
            if (boostSupply > 0) {
                uint256 blocks = block.number - pool.lastRewardBlock;
                uint256 preciousReward = (blocks * preciousPerBlock * pool.allocPoint) /
                    totalAllocPoint;
                pool.accPreciousPerBoost =
                    pool.accPreciousPerBoost +
                    uint128((preciousReward * ACC_PRECIOUS_PRECISION) / boostSupply);
            }
            pool.lastRewardBlock = uint64(block.number);
            poolInfo[pid] = pool;
            emit UpdatePool(pid, pool.accPreciousPerBoost);
        }
    }

    /// @notice Harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of PRECIOUS rewards.
    function harvest(uint256 pid, address to) external {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender];

        int256 accumulatedPrecious = int256(
            (user.boost * pool.accPreciousPerBoost) / ACC_PRECIOUS_PRECISION
        );
        uint256 _pendingPrecious = uint256(accumulatedPrecious - user.rewardDebt);

        // Effects
        user.rewardDebt = accumulatedPrecious;

        // Interactions
        if (_pendingPrecious != 0) {
            precious.safeTransfer(to, _pendingPrecious);

            emit Harvest(pid, msg.sender, to, _pendingPrecious);
        }
    }

    /** VIEW FUNCTIONS */
    /// @notice Returns the number of pools.
    function poolLength() public view returns (uint256 pools) {
        pools = poolInfo.length;
    }

    /// @notice View function to see pending PRECIOUS.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _user Address of user.
    /// @return pending PRECIOUS reward for a given user.
    function pendingPrecious(uint256 _pid, address _user) external view returns (uint256 pending) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accPreciousPerShare = pool.accPreciousPerBoost;
        uint256 boostSupply = pool.boostSupply;
        if (block.number > pool.lastRewardBlock && boostSupply != 0) {
            uint256 blocks = block.number - pool.lastRewardBlock;
            uint256 preciousReward = (blocks * preciousPerBlock * pool.allocPoint) /
                totalAllocPoint;
            accPreciousPerShare =
                accPreciousPerShare +
                (preciousReward * ACC_PRECIOUS_PRECISION) /
                boostSupply;
        }
        pending = uint256(
            int256((user.boost * accPreciousPerShare) / ACC_PRECIOUS_PRECISION) - user.rewardDebt
        );
    }
}
