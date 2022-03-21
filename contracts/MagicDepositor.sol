// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './MAGIC/IAtlasMine.sol';
import {IRewards,IMagicDepositor} from"./Interfaces.sol";
import './mgMagicToken.sol';
import { AtlasDeposit, AtlasDepositLibrary } from './libs/AtlasDeposit.sol';
import './MagicDepositorConfig.sol';

////////////////////////////////////////////
//  REMEMBER TO REMOVE THIS PRIOR TO PRODUCTION DEPLOY!
////////////////////////////////////////////
import 'hardhat/console.sol';

contract MagicDepositor is IMagicDepositor,MagicDepositorConfig {
    using SafeERC20 for IERC20;
    using SafeERC20 for mgMagicToken;
    using AtlasDepositLibrary for AtlasDeposit;

    /** Constants */
    uint8 private constant LOCK_FOR_TWELVE_MONTH = 4;
    uint256 private constant ONE_MONTH = 30 days;
    uint256 private constant PRECISION = 1e18;

    /** Immutables */
    IERC20 private immutable magic;
    mgMagicToken private immutable mgMagic;
    IAtlasMine private immutable atlasMine;
    IRewards private immutable lockRewards;
    IRewards private immutable stakerRewards;

    /** State variables */
    mapping(uint256 => AtlasDeposit) public atlasDeposits;
    uint256 public currentAtlasDepositIndex; // Most recent accumulated atlasDeposit
    uint256 public harvestForNextDeposit; // Accumulated magic through harvest that is going to be recompounded on the next atlasDeposit
    uint256 public harvestForStakeRewards; // " " that is going to be used to reward stakers(staking Precious rewards)
    uint256 public harvestForLockRewards; // " " that is going to sent to the locked rewards(staking prMagic rewards)
    uint256 public heldMagic; // Internal accounting that determines the amount of shares to mint on each atlasDeposit operation

    event ClaimMintedShares(address indexed user, uint256 indexed atlasDepositIndex, uint256 claim);
    event WithdrawStakeRewards(address indexed caller, uint256 amount);
    event WithdrawTreasury(address indexed caller, uint256 amount);
    event DepositFor(address indexed from, address indexed to, uint256 amount);
    event ActivateDeposit(
        uint256 indexed atlasDepositIndex,
        uint256 depositAmount,
        uint256 accumulatedMagic,
        uint256 mintedShares
    );
    event RewardsEarmarked(address indexed user,uint256 harvestStakedAmount,uint256 harvestLockedAmount);

    constructor(
        address _magic,
        address _mgMagic,
        address _atlasMine,
        address _lockRewards,
        address _stakeRewards
    ) {
        magic = IERC20(_magic);
        mgMagic = mgMagicToken(_mgMagic);
        atlasMine = IAtlasMine(_atlasMine);
        lockRewards = IRewards(_lockRewards);
        stakerRewards = IRewards(_stakeRewards);
    }

    /** USER EXPOSED FUNCTIONS */

    function deposit(uint256 amount) external override {
        _depositFor(amount, msg.sender);
    }

    function depositFor(uint256 amount, address to) external override {
        _depositFor(amount, to);
    }

    function claimMintedShares(uint256 atlasDepositIndex,bool stake) external override returns (uint256) {
        AtlasDeposit storage atlasDeposit = atlasDeposits[atlasDepositIndex];
        require(atlasDeposit.exists, 'Deposit does not exist');
        require(atlasDeposit.isActive, 'Deposit has not been activated yet');

        uint256 claim = (atlasDeposit.depositedMagicPerAddress[msg.sender] * atlasDeposit.mintedShares) /
            atlasDeposit.accumulatedMagic;
        require(claim > 0, 'Nothing to claim');

        atlasDeposit.depositedMagicPerAddress[msg.sender] = 0;

        if(stake){
            mgMagic.safeApprove(address(lockRewards),0);
            mgMagic.safeApprove(address(lockRewards),claim);
            lockRewards.stakeFor(msg.sender,claim);
        }
        else{
            mgMagic.safeTransfer(msg.sender, claim);
        }
        emit ClaimMintedShares(msg.sender, atlasDepositIndex, claim);
        return claim;
    }

    //disperse stakedRewards and LockRewards to reward contracts
    function earmarkRewards() external override{

        // will be send incentives for calling earmarkRewards() in later version 
        // magic.safeTransfer(msg.sender, callIncentive);          
        uint256 harvestStakedAmount = harvestForStakeRewards;
        uint256 harvestLockedAmount = harvestForLockRewards;

        if (harvestStakedAmount > 0) {
            harvestForStakeRewards = 0;
            //send stakers's share of magic to reward contract
            magic.safeTransfer(address(stakerRewards),harvestStakedAmount);
            IRewards(stakerRewards).queueNewRewards(harvestStakedAmount);
        }

        if(harvestForLockRewards > 0){
            harvestForLockRewards = 0;
            //send lockers' share of magic to reward contract
            magic.safeTransfer(address(lockRewards), harvestLockedAmount);
            IRewards(lockRewards).queueNewRewards(harvestLockedAmount);
        }
        
        emit RewardsEarmarked(msg.sender,harvestStakedAmount,harvestLockedAmount);
    }

    function update() external override{
        _updateAtlasDeposits();
        // maybe add _checkCurrentDeposit() if it does not brick the contract
    }

    /** VIEW FUNCTIONS */
    function getUserDeposittedMagic(uint256 atlasDepositId, address user) public override view returns (uint256) {
        return atlasDeposits[atlasDepositId].depositedMagicPerAddress[user];
    }

    /** INTERNAL FUNCTIONS */

    function _depositFor(uint256 amount, address to) internal {
        require(amount > 0, 'amount cannot be 0');
        require(to != address(0), 'cannot deposit for 0x0');

        _updateAtlasDeposits();
        _checkCurrentDeposit().increaseMagic(amount, to);
        magic.safeTransferFrom(msg.sender, address(this), amount);

        emit DepositFor(msg.sender, to, amount);
    }

    function _updateAtlasDeposits() internal {
        uint256 withdrawnAmount = _withdraw(); // Need to check this first so that deposits are removed on the harvest call @ mine
        uint256 harvestedAmount = _harvest();
        //treasuery split is rewardSplit of lockRewards pool
        uint256 stakeRewardIncrement = (harvestedAmount * stakeRewardSplit) / PRECISION;
        uint256 lockRewardsIncrement = (harvestedAmount * treasurySplit) / PRECISION;
        uint256 heldMagicIncrement = harvestedAmount - stakeRewardIncrement - lockRewardsIncrement;

        harvestForStakeRewards += stakeRewardIncrement;
        harvestForLockRewards += lockRewardsIncrement;
        heldMagic += heldMagicIncrement;

        harvestForNextDeposit += withdrawnAmount + heldMagicIncrement;
    }

    function _checkCurrentDeposit() internal returns (AtlasDeposit storage) {
        AtlasDeposit storage atlasDeposit = atlasDeposits[currentAtlasDepositIndex];
        if (!atlasDeposit.exists) return _initializeNewAtlasDeposit();
        if (!atlasDeposit.isActive && atlasDeposit.canBeActivated()) {
            _activateDeposit(atlasDeposit);
            return _initializeNewAtlasDeposit();
        }

        return atlasDeposit;
    }

    /// @dev this function should be called after _withdraw() to maintain this contract in sync
    /// with the AtlasMine
    function _harvest() internal returns (uint256 magicBalanceIncrement) {
        uint256 magicBalancePreUpdate = magic.balanceOf(address(this));
        atlasMine.harvestAll();

        magicBalanceIncrement = magic.balanceOf(address(this)) - magicBalancePreUpdate;
    }

    function _withdraw() internal returns (uint256 magicBalanceWithdrawn) {
        uint256 magicBalancePreUpdate = magic.balanceOf(address(this));
        unchecked {
            uint256[] memory depositIds = atlasMine.getAllUserDepositIds(address(this));
            for (uint256 i = 0; i < depositIds.length; i++) {
                uint256 depositId = depositIds[i];

                (, , , uint256 lockTimestamp, , , ) = atlasMine.userInfo(address(this), depositId);
                if (lockTimestamp < block.timestamp) atlasMine.withdrawPosition(depositId, type(uint256).max);
            }
        }
        return magic.balanceOf(address(this)) - magicBalancePreUpdate;
    }

    function _initializeNewAtlasDeposit() internal returns (AtlasDeposit storage atlasDeposit) {
        atlasDeposit = atlasDeposits[++currentAtlasDepositIndex];
        atlasDeposit.exists = true;
        atlasDeposit.activationTimestamp = block.timestamp + ONE_MONTH;
        return atlasDeposit;
    }

    function _activateDeposit(AtlasDeposit storage atlasDeposit) internal {
        atlasDeposit.isActive = true;
        uint256 accumulatedMagic = atlasDeposit.accumulatedMagic;

        uint256 totalExistingShares = mgMagic.totalSupply();

        uint256 mintedShares = totalExistingShares > 0
            ? (accumulatedMagic * mgMagic.totalSupply()) / heldMagic
            : accumulatedMagic;

        atlasDeposit.mintedShares = mintedShares;
        heldMagic += accumulatedMagic;

        mgMagic.mint(address(this), mintedShares);

        uint256 depositAmount = accumulatedMagic + harvestForNextDeposit;
        magic.approve(address(atlasMine), depositAmount);
        harvestForNextDeposit = 0;
        atlasMine.deposit(depositAmount, LOCK_FOR_TWELVE_MONTH);

        emit ActivateDeposit(currentAtlasDepositIndex, depositAmount, accumulatedMagic, mintedShares);
    }
}
