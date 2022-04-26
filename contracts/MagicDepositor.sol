// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MAGIC/IAtlasMine.sol";
import {IRewards, IMagicDepositor, IPrMagicToken} from "./Interfaces.sol";
import {AtlasDeposit, AtlasDepositLibrary} from "./libs/AtlasDeposit.sol";
import "./MagicDepositorConfig.sol";
import "./MagicNftStaking.sol";

/// @title MagicDepositor
/// @notice cvxCRV like perpetual staking contract of MAGIC tokens
contract MagicDepositor is Initializable, IMagicDepositor, MagicDepositorConfig, MagicNftStaking {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IPrMagicToken;
    using AtlasDepositLibrary for AtlasDeposit;

    /** Constants */
    uint8 private constant LOCK_FOR_TWELVE_MONTH = 4;
    uint256 private constant ONE_WEEK = 7 days;
    uint256 private constant PRECISION = 1e18;

    /// @notice Address of Magic token
    IERC20Upgradeable public magic;
    /// @notice Address of prMagic token(similar to cvxCRV)
    IPrMagicToken public prMagic;

    /** State variables */
    /// @notice Info of each deposit
    mapping(uint256 => AtlasDeposit) public atlasDeposits;
    /// @notice Most recent accumulated atlasDeposit
    uint256 public currentAtlasDepositIndex;
    /// @notice // Accumulated magic through harvest that is going to be recompounded on the next atlasDeposit
    uint256 public harvestForNextDeposit;

    /// @notice Event for set stakeOnClaim flag
    /// @param user Address of user
    /// @param atlasDepositIndex Index of the deposit
    /// @param stake If true, the claimed prMagic is auto staked
    event SetStakeOnClaim(address indexed user, uint256 indexed atlasDepositIndex, bool stake);

    /// @notice Event for claiming prMagic for activated deposits
    /// @param user Address of user claiming prMagic
    /// @param atlasDepositIndex Activated deposit index
    /// @param claim Amount of prMagic
    event ClaimMintedShares(address indexed user, uint256 indexed atlasDepositIndex, uint256 claim);

    /// @notice Event for depositing Magic tokens
    /// @param from Address of user that deposits Magic tokens
    /// @param to Address of user that receives prMagic tokens
    /// @param atlasDepositIndex Index of the deposit
    /// @param amount Amount of deposit
    /// @param stake If true, the claimed prMagic is auto staked
    event DepositFor(
        address indexed from,
        address indexed to,
        uint256 indexed atlasDepositIndex,
        uint256 amount,
        bool stake
    );

    /// @notice Event for activating a deposit
    /// @param atlasDepositIndex Index of the deposit
    /// @param depositAmount The amount of Magic token deposited into AtlasMine
    /// @param accumulatedMagic The amount of Magic token deposited during the epoch
    event ActivateDeposit(
        uint256 indexed atlasDepositIndex,
        uint256 depositAmount,
        uint256 accumulatedMagic
    );

    /// @notice Event for dispersing rewards to the staking and treasury
    /// @param user Address of user that trigger the dispersing
    /// @param treasuryReward The amount of Magic tokens for the treasury
    /// @param stakingReward The amount of Magic tokens for the staking
    event RewardsEarmarked(address indexed user, uint256 treasuryReward, uint256 stakingReward);

    function initialize(
        address _magic,
        address _prMagic,
        address _atlasMine,
        address _treasure,
        address _legion,
        address _lendAuction
    ) external initializer {
        __Ownable_init_unchained();
        __MagicStaking_init_unchained(_atlasMine, _treasure, _legion, _lendAuction);

        magic = IERC20Upgradeable(_magic);
        prMagic = IPrMagicToken(_prMagic);
    }

    /** USER EXPOSED FUNCTIONS */
    /// @notice Deposit Magic tokens
    /// @param amount The amount of Magic
    function deposit(uint256 amount, bool stakeOnClaim) external override {
        _depositFor(amount, msg.sender, stakeOnClaim);
    }

    /// @notice Deposit Magic tokens
    /// @param amount The amount of Magic
    /// @param to The address to receive prMagic
    function depositFor(
        uint256 amount,
        address to,
        bool stakeOnClaim
    ) external override {
        _depositFor(amount, to, stakeOnClaim);
    }

    /// @notice Claim prMagic token
    /// @param atlasDepositIndex The index of deposit
    /// @param stake If true, then stake prMagic into staking. Otherwise send prMagic to the user
    function claimMintedShares(uint256 atlasDepositIndex, bool stake)
        external
        override
        returns (uint256)
    {
        AtlasDeposit storage atlasDeposit = atlasDeposits[atlasDepositIndex];
        require(atlasDeposit.activationTimestamp > 0, "Deposit does not exist");
        require(atlasDeposit.isActive, "Deposit has not been activated yet");

        uint256 claim = atlasDeposit.depositedMagicPerAddress[msg.sender];
        require(claim > 0, "Nothing to claim");

        atlasDeposit.depositedMagicPerAddress[msg.sender] = 0;

        if (stake) {
            prMagic.safeIncreaseAllowance(staking, claim);
            IRewards(staking).stakeFor(msg.sender, claim);
        } else {
            prMagic.safeTransfer(msg.sender, claim);
        }
        emit ClaimMintedShares(msg.sender, atlasDepositIndex, claim);
        return claim;
    }

    /// @notice Set stakeOnClaim of the give deposit index
    /// @param atlasDepositIndex The index of deposit
    /// @param stake If true, the claimed prMagic is auto staked
    function setStakeOnClaim(uint256 atlasDepositIndex, bool stake) external {
        AtlasDeposit storage atlasDeposit = atlasDeposits[atlasDepositIndex];
        require(atlasDeposit.activationTimestamp > 0, "Deposit does not exist");
        require(
            atlasDeposit.depositedMagicPerAddress[msg.sender] > 0,
            "Deposit is already staked or no amount deposited"
        );

        atlasDeposit.stakeOnClaim[msg.sender] = stake;

        emit SetStakeOnClaim(msg.sender, atlasDepositIndex, stake);
    }

    /// @notice Batch claim prMagic token on behalf of users
    /// @param atlasDepositIndex The index of deposit
    /// @param users Addresses
    function batchClaimMintedShares(uint256 atlasDepositIndex, address[] calldata users) external {
        AtlasDeposit storage atlasDeposit = atlasDeposits[atlasDepositIndex];
        require(atlasDeposit.activationTimestamp > 0, "Deposit does not exist");
        require(atlasDeposit.isActive, "Deposit has not been activated yet");

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 claim = atlasDeposit.depositedMagicPerAddress[user];

            if (claim > 0) {
                atlasDeposit.depositedMagicPerAddress[user] = 0;

                if (atlasDeposit.stakeOnClaim[user]) {
                    prMagic.safeIncreaseAllowance(staking, claim);
                    IRewards(staking).stakeFor(user, claim);
                } else {
                    prMagic.safeTransfer(user, claim);
                }
                emit ClaimMintedShares(user, atlasDepositIndex, claim);
            }
        }
    }

    /// @notice Withdraw unlocked deposit, Harvest rewards for all deposits, Disperse rewards
    function update() external override {
        require(atlasMine.unlockAll() == false, "locked");
        _updateAtlasDeposits();
        _checkCurrentDeposit();
    }

    /// @notice Withdraw and harvest all deposit and keep in the contract
    function withdrawAndHarvestAll() external override {
        require(atlasMine.unlockAll(), "not unlocked");
        atlasMine.withdrawAndHarvestAll();
    }

    /** VIEW FUNCTIONS */
    /// @notice Return the Magic token amount of the user deposited in a specific epoch
    /// @param atlasDepositId The index of deposit
    /// @param user Address of user
    function getUserDepositedMagic(uint256 atlasDepositId, address user)
        public
        view
        override
        returns (uint256)
    {
        return atlasDeposits[atlasDepositId].depositedMagicPerAddress[user];
    }

    /** INTERNAL FUNCTIONS */
    /// @notice Deposit Magic tokens
    /// @param amount The amount of Magic
    /// @param to The address to receive prMagic
    function _depositFor(
        uint256 amount,
        address to,
        bool stakeOnClaim
    ) internal {
        require(amount > 0, "amount cannot be 0");
        require(to != address(0), "cannot deposit for 0x0");
        require(atlasMine.unlockAll() == false, "locked");

        _checkCurrentDeposit().increaseMagic(amount, to, stakeOnClaim);
        magic.safeTransferFrom(msg.sender, address(this), amount);

        emit DepositFor(msg.sender, to, currentAtlasDepositIndex, amount, stakeOnClaim);
    }

    /// @dev Withdraw unlocked deposit, Harvest rewards for all deposits, Disperse rewards
    function _updateAtlasDeposits() internal {
        uint256 withdrawnAmount = _withdraw(); // Need to check this first so that deposits are removed on the harvest call @ mine
        harvestForNextDeposit += withdrawnAmount;

        uint256 harvestedAmount = _harvest();
        uint256 stakeRewardIncrement = (harvestedAmount * stakeRewardSplit) / PRECISION;
        uint256 treasuryIncrement = harvestedAmount - stakeRewardIncrement;

        _earmarkRewards(stakeRewardIncrement, treasuryIncrement);
    }

    /// @dev Init the current deposit if not exist. Check the current deposit and if it can be active
    /// deposit the Magic tokens to the AltasMine and start a new deposit
    function _checkCurrentDeposit() internal returns (AtlasDeposit storage) {
        AtlasDeposit storage atlasDeposit = atlasDeposits[currentAtlasDepositIndex];
        if (atlasDeposit.activationTimestamp == 0) return _initializeNewAtlasDeposit();
        if (!atlasDeposit.isActive && atlasDeposit.canBeActivated()) {
            _activateDeposit(atlasDeposit);
            return _initializeNewAtlasDeposit();
        }

        return atlasDeposit;
    }

    /// @dev Harvest rewards for all active deposits
    /// @dev this function should be called after _withdraw() to maintain this contract in sync
    /// with the AtlasMine
    function _harvest() internal returns (uint256 magicBalanceIncrement) {
        uint256 magicBalancePreUpdate = magic.balanceOf(address(this));
        atlasMine.harvestAll();

        magicBalanceIncrement = magic.balanceOf(address(this)) - magicBalancePreUpdate;
    }

    /// @dev Withdraw Magic of unlock deposits from AtlasMine
    function _withdraw() internal returns (uint256 magicBalanceWithdrawn) {
        uint256 magicBalancePreUpdate = magic.balanceOf(address(this));
        unchecked {
            uint256[] memory depositIds = atlasMine.getAllUserDepositIds(address(this));
            for (uint256 i = 0; i < depositIds.length; i++) {
                uint256 depositId = depositIds[i];

                (, , , uint256 lockTimestamp, , , ) = atlasMine.userInfo(address(this), depositId);
                if (lockTimestamp < block.timestamp)
                    atlasMine.withdrawPosition(depositId, type(uint256).max);
            }
        }
        return magic.balanceOf(address(this)) - magicBalancePreUpdate;
    }

    /// @dev Init a new deposit. The activiation timestamp is determined here.
    function _initializeNewAtlasDeposit() internal returns (AtlasDeposit storage atlasDeposit) {
        atlasDeposit = atlasDeposits[++currentAtlasDepositIndex];
        atlasDeposit.activationTimestamp = block.timestamp + ONE_WEEK;
        return atlasDeposit;
    }

    /// @dev Activate a deposit. Deposit accumulatedMagic and unlocked Magic during
    // the epoch to the AtlasMine. Calculate the amount of prMagic to be minted.
    /// @param atlasDeposit Info of the deposit
    function _activateDeposit(AtlasDeposit storage atlasDeposit) internal {
        atlasDeposit.isActive = true;
        uint256 accumulatedMagic = atlasDeposit.accumulatedMagic;

        prMagic.mint(address(this), accumulatedMagic);

        uint256 depositAmount = accumulatedMagic + harvestForNextDeposit;
        magic.approve(address(atlasMine), depositAmount);
        harvestForNextDeposit = 0;
        atlasMine.deposit(depositAmount, LOCK_FOR_TWELVE_MONTH);

        emit ActivateDeposit(currentAtlasDepositIndex, depositAmount, accumulatedMagic);
    }

    /// @dev Disperse stakedRewards and treasuryRewards to reward contracts
    /// @param stakingReward The amount of staking rewards
    /// @param stakingReward The amount of treasury rewards
    function _earmarkRewards(uint256 stakingReward, uint256 treasuryReward) internal {
        // will be send incentives for calling earmarkRewards() in later version
        // magic.safeTransfer(msg.sender, callIncentive);

        if (treasuryReward > 0) {
            //send share of magic to treasury
            magic.safeTransfer(treasury, treasuryReward);
        }

        if (stakingReward > 0) {
            //send lockers' share of magic to reward contract
            magic.safeTransfer(staking, stakingReward);
            IRewards(staking).queueNewRewards(stakingReward);
        }

        emit RewardsEarmarked(msg.sender, treasuryReward, stakingReward);
    }
}
