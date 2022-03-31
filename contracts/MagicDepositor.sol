// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MAGIC/IAtlasMine.sol";
import {IRewards, IMagicDepositor} from "./Interfaces.sol";
import "./prMagicToken.sol";
import {AtlasDeposit, AtlasDepositLibrary} from "./libs/AtlasDeposit.sol";
import "./MagicDepositorConfig.sol";
import "./MagicStaking.sol";

/// @title MagicDepositor
/// @notice cvxCRV like perpetual staking contract of MAGIC tokens
contract MagicDepositor is IMagicDepositor, MagicDepositorConfig, MagicStaking {
    using SafeERC20 for IERC20;
    using SafeERC20 for prMagicToken;
    using AtlasDepositLibrary for AtlasDeposit;

    /** Constants */
    uint8 private constant LOCK_FOR_TWELVE_MONTH = 4;
    uint256 private constant ONE_WEEK = 7 days;
    uint256 private constant PRECISION = 1e18;

    /// @notice Address of Magic token
    IERC20 public magic;
    /// @notice Address of prMagic token(similar to cvxCRV)
    prMagicToken public prMagic;

    /** State variables */
    /// @notice Info of each deposit
    mapping(uint256 => AtlasDeposit) public atlasDeposits;
    /// @notice Most recent accumulated atlasDeposit
    uint256 public currentAtlasDepositIndex;
    /// @notice // Accumulated magic through harvest that is going to be recompounded on the next atlasDeposit
    uint256 public harvestForNextDeposit;
    /// @notice // Internal accounting that determines the amount of shares to mint on each atlasDeposit operation
    uint256 public heldMagic;

    /// @notice Event for claiming prMagic for activated deposits
    /// @param user Address of user claiming prMagic
    /// @param atlasDepositIndex Activated deposit index
    /// @param claim Amount of prMagic
    event ClaimMintedShares(address indexed user, uint256 indexed atlasDepositIndex, uint256 claim);

    /// @notice Event for depositing Magic tokens
    /// @param from Address of user that deposits Magic tokens
    /// @param to Address of user that receives prMagic tokens
    /// @param amount Amount of deposit
    event DepositFor(address indexed from, address indexed to, uint256 amount);

    /// @notice Event for activating a deposit
    /// @param atlasDepositIndex Index of the deposit
    /// @param depositAmount The amount of Magic token deposited into AtlasMine
    /// @param accumulatedMagic The amount of Magic token deposited during the epoch
    /// @param mintedShares The amount prMagic minted for the epoch
    event ActivateDeposit(
        uint256 indexed atlasDepositIndex,
        uint256 depositAmount,
        uint256 accumulatedMagic,
        uint256 mintedShares
    );

    /// @notice Event for dispersing rewards to the staking and treasury
    /// @param user Address of user that trigger the dispersing
    /// @param treasuryReward The amount of Magic tokens for the treasury
    /// @param stakingReward The amount of Magic tokens for the staking
    event RewardsEarmarked(address indexed user, uint256 treasuryReward, uint256 stakingReward);

    constructor(
        address _magic,
        address _prMagic,
        address _atlasMine,
        address _treasure,
        address _legion
    ) MagicStaking(_atlasMine, _treasure, _legion) {
        magic = IERC20(_magic);
        prMagic = prMagicToken(_prMagic);
    }

    /** USER EXPOSED FUNCTIONS */
    /// @notice Deposit Magic tokens
    /// @param amount The amount of Magic
    function deposit(uint256 amount) external override {
        _depositFor(amount, msg.sender);
    }

    /// @notice Deposit Magic tokens
    /// @param amount The amount of Magic
    /// @param to The address to receive prMagic
    function depositFor(uint256 amount, address to) external override {
        _depositFor(amount, to);
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
        require(atlasDeposit.exists, "Deposit does not exist");
        require(atlasDeposit.isActive, "Deposit has not been activated yet");

        uint256 claim = (atlasDeposit.depositedMagicPerAddress[msg.sender] *
            atlasDeposit.mintedShares) / atlasDeposit.accumulatedMagic;
        require(claim > 0, "Nothing to claim");

        atlasDeposit.depositedMagicPerAddress[msg.sender] = 0;

        if (stake) {
            prMagic.safeApprove(staking, 0);
            prMagic.safeApprove(staking, claim);
            IRewards(staking).stakeFor(msg.sender, claim);
        } else {
            prMagic.safeTransfer(msg.sender, claim);
        }
        emit ClaimMintedShares(msg.sender, atlasDepositIndex, claim);
        return claim;
    }

    /// @notice Withdraw unlocked deposit, Harvest rewards for all deposits, Disperse rewards
    function update() external override {
        _updateAtlasDeposits();
        // maybe add _checkCurrentDeposit() if it does not brick the contract
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
    function _depositFor(uint256 amount, address to) internal {
        require(amount > 0, "amount cannot be 0");
        require(to != address(0), "cannot deposit for 0x0");

        _updateAtlasDeposits();
        _checkCurrentDeposit().increaseMagic(amount, to);
        magic.safeTransferFrom(msg.sender, address(this), amount);

        emit DepositFor(msg.sender, to, amount);
    }

    /// @dev Withdraw unlocked deposit, Harvest rewards for all deposits, Disperse rewards
    function _updateAtlasDeposits() internal {
        uint256 withdrawnAmount = _withdraw(); // Need to check this first so that deposits are removed on the harvest call @ mine
        uint256 harvestedAmount = _harvest();
        uint256 stakeRewardIncrement = (harvestedAmount * stakeRewardSplit) / PRECISION;
        uint256 treasuryIncrement = (harvestedAmount * treasurySplit) / PRECISION;
        uint256 heldMagicIncrement = harvestedAmount - stakeRewardIncrement - treasuryIncrement;

        _earmarkRewards(stakeRewardIncrement, treasuryIncrement);
        heldMagic += heldMagicIncrement;

        harvestForNextDeposit += withdrawnAmount + heldMagicIncrement;
    }

    /// @dev Init the current deposit if not exist. Check the current deposit and if it can be active
    /// deposit the Magic tokens to the AltasMine and start a new deposit
    function _checkCurrentDeposit() internal returns (AtlasDeposit storage) {
        AtlasDeposit storage atlasDeposit = atlasDeposits[currentAtlasDepositIndex];
        if (!atlasDeposit.exists) return _initializeNewAtlasDeposit();
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
        atlasDeposit.exists = true;
        atlasDeposit.activationTimestamp = block.timestamp + ONE_WEEK;
        return atlasDeposit;
    }

    /// @dev Activate a deposit. Deposit accumulatedMagic and unlocked Magic during
    // the epoch to the AtlasMine. Calculate the amount of prMagic to be minted.
    /// @param atlasDeposit Info of the deposit
    function _activateDeposit(AtlasDeposit storage atlasDeposit) internal {
        atlasDeposit.isActive = true;
        uint256 accumulatedMagic = atlasDeposit.accumulatedMagic;

        uint256 totalExistingShares = prMagic.totalSupply();

        uint256 mintedShares = totalExistingShares > 0
            ? (accumulatedMagic * prMagic.totalSupply()) / heldMagic
            : accumulatedMagic;

        atlasDeposit.mintedShares = mintedShares;
        heldMagic += accumulatedMagic;

        prMagic.mint(address(this), mintedShares);

        uint256 depositAmount = accumulatedMagic + harvestForNextDeposit;
        magic.approve(address(atlasMine), depositAmount);
        harvestForNextDeposit = 0;
        atlasMine.deposit(depositAmount, LOCK_FOR_TWELVE_MONTH);

        emit ActivateDeposit(
            currentAtlasDepositIndex,
            depositAmount,
            accumulatedMagic,
            mintedShares
        );
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
