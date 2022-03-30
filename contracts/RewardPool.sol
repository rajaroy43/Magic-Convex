// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./libs/MathUtil.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title RewardPool
/// @notice stake prMagic token and receive magic token
contract RewardPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;
    IERC20 public immutable stakingToken;
    uint256 public constant duration = 7 days;

    address public immutable operator;

    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public queuedRewards;
    uint256 public currentRewards;
    uint256 public historicalRewards;
    uint256 public constant newRewardRatio = 830;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);

    constructor(
        address _stakingToken,
        address _rewardToken,
        address _operator
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        operator = _operator;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return MathUtil.min(block.timestamp, periodFinish);
    }

    /// @notice get reward per token till now
    function rewardPerToken() public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - lastUpdateTime) * 1e18) /
            supply;
    }

    /// @notice getting how much amount of reward token  user have accumulated
    /// @param account for address account

    function earned(address account) public view returns (uint256) {
        return
            ((balanceOf(account) * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    /// @notice staking amount of prMagic token for caller
    /// @param _amount how much amount of prMagic user wan't to stake

    function stake(uint256 _amount) public {
        _stake(msg.sender, _amount);
    }

    /// @notice staking amount of prMagic token for _for address
    /// @param _for staking for address _for
    /// @param _amount how much amount of prMagic user wan't to stake

    function stakeFor(address _for, uint256 _amount) public {
        _stake(_for, _amount);
    }

    function _stake(address _for, uint256 _amount) internal updateReward(_for) {
        require(_amount > 0, "RewardPool : Cannot stake 0");

        //add supply
        _totalSupply = _totalSupply + _amount;
        //add to _for's balance sheet
        _balances[_for] = _balances[_for] + _amount;
        //take tokens from sender
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount);
    }

    /// @notice unstaking amount of prMagic token from contract
    /// @param _amount how much amount of prMagic user wan't to unstake/withdraw
    /// @param claim if claim true ,then after withdrawing user will get reward in same transaction

    function withdraw(uint256 _amount, bool claim) public updateReward(msg.sender) {
        require(_amount > 0, "RewardPool : Cannot withdraw 0");

        _totalSupply = _totalSupply - _amount;
        _balances[msg.sender] = _balances[msg.sender] - _amount;
        stakingToken.safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);

        if (claim) {
            getReward(msg.sender);
        }
    }

    /// @notice getting rewrd for  address  _account
    /// @param _account address of user

    function getReward(address _account) public updateReward(_account) {
        uint256 reward = earned(_account);
        if (reward > 0) {
            rewards[_account] = 0;
            rewardToken.safeTransfer(_account, reward);
            emit RewardPaid(_account, reward);
        }
    }

    /// @notice donate _amount of magic token to this contract
    /// @param _amount how much amount of token donation

    function donate(uint256 _amount) external {
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), _amount);
        queuedRewards = queuedRewards + _amount;
    }

    /// @notice updating new reward and reward rate ,if here time passes against periodFinish
    /// @param _rewards how much amount of _rewards token operatow will add
    // Here operator will be magicDepositor contract

    function queueNewRewards(uint256 _rewards) external {
        require(msg.sender == operator, "!authorized");

        _rewards = _rewards + queuedRewards;

        if (block.timestamp >= periodFinish) {
            notifyRewardAmount(_rewards);
            queuedRewards = 0;
            return;
        }

        //et = now - (finish-duration)
        uint256 elapsedTime = block.timestamp - (periodFinish - duration);
        //current at now: rewardRate * elapsedTime
        uint256 currentAtNow = rewardRate * elapsedTime;
        uint256 queuedRatio = (currentAtNow * 1000) / _rewards;
        if (queuedRatio < newRewardRatio) {
            notifyRewardAmount(_rewards);
            queuedRewards = 0;
        } else {
            queuedRewards = _rewards;
        }
    }

    /// @notice notifying how much amount of reward is recived
    function notifyRewardAmount(uint256 reward) internal updateReward(address(0)) {
        historicalRewards = historicalRewards + reward;
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / duration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            reward = reward + leftover;
            rewardRate = reward / duration;
        }
        currentRewards = reward;
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + duration;
        emit RewardAdded(reward);
    }
}
