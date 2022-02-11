// SPDX-License-Identifier: MIT
pragma solidity 0.8;

import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './MAGIC/IAtlasMine.sol';

import './mgMagicToken.sol';
import { AtlasDeposit, AtlasDepositLibrary } from './libs/AtlasDeposit.sol';

contract MagicDepositor is Ownable {
    using SafeERC20 for IERC20;
    using AtlasDepositLibrary for AtlasDeposit;

    uint8 private constant LOCK_FOR_TWELVE_MONTH = 4;
    uint256 private constant ONE_MONTH = 30 days;
    uint256 private constant PRECISION = 1e18;

    IERC20 immutable magic;
    mgMagicToken immutable mgMagic;
    IAtlasMine immutable atlasMine;

    mapping(uint256 => AtlasDeposit) _atlasDeposits;

    uint256 currentAtlasDepositIndex;
    uint256 harvestForNextDeposit;
    uint256 heldMagic;

    constructor(
        address _magic,
        address _mgMagic,
        address _atlasMine
    ) {
        magic = IERC20(_magic);
        mgMagic = mgMagicToken(_mgMagic);
        atlasMine = IAtlasMine(_atlasMine);
    }

    function depositFor(uint256 amount, address to) external {
        require(amount > 0, 'amount cannot be 0');
        require(to != address(0), 'cannot deposit to 0x0');

        _updateAtlasDeposits();
        _checkCurrentDeposit().increaseMagic(amount, to);
        magic.safeTransferFrom(msg.sender, address(this), amount);
    }

    function claimMintedShares(uint256 atlasDepositIndex) external returns (uint256) {
        AtlasDeposit storage deposit = _atlasDeposits[atlasDepositIndex];
        require(deposit.exists, 'Deposit does not exist');
        require(deposit.isActive, 'Deposit has not been activated yet');

        uint256 claim = (deposit.depositedMagicPerAddress[msg.sender] * deposit.mintedShares) /
            deposit.accumulatedMagic;
        require(claim > 0, 'Nothing to claim');

        deposit.depositedMagicPerAddress[msg.sender] = 0;
        mgMagic.transfer(msg.sender, claim);
        return claim;
    }

    function _updateAtlasDeposits() internal {
        uint256 withdrawnAmount = _withdraw(); // Need to check this first so that deposits are removed on the harvest call @ mine
        uint256 harvestedAmount = _harvest();
        harvestForNextDeposit += harvestedAmount + withdrawnAmount;
    }

    function _checkCurrentDeposit() internal returns (AtlasDeposit storage) {
        AtlasDeposit storage deposit = _atlasDeposits[currentAtlasDepositIndex];
        if (!deposit.exists) return _initializeNewAtlasDeposit();
        if (!deposit.isActive) {
            _activateDeposit(deposit);
            return _initializeNewAtlasDeposit();
        }

        return deposit;
    }

    /// @dev this function should be called after _withdraw() to maintain this contract in sync
    /// with the AtlasMine
    function _harvest() internal returns (uint256 magicBalanceIncrement) {
        uint256 magicBalancePreUpdate = magic.balanceOf(address(this));
        atlasMine.harvestAll();

        magicBalanceIncrement = magic.balanceOf(address(this)) - magicBalancePreUpdate;
        heldMagic += magicBalanceIncrement;
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

    function _initializeNewAtlasDeposit() internal returns (AtlasDeposit storage deposit) {
        deposit = _atlasDeposits[currentAtlasDepositIndex++];
        deposit.exists = true;
        deposit.activationTimestamp = block.timestamp + ONE_MONTH;
        return deposit;
    }

    function _activateDeposit(AtlasDeposit storage deposit) internal {
        deposit.isActive = true;
        uint256 amount = deposit.accumulatedMagic;

        uint256 mintedShares = (amount * mgMagic.totalSupply()) / heldMagic;
        deposit.mintedShares = mintedShares;

        mgMagic.mint(address(this), mintedShares);
        magic.approve(address(atlasMine), amount + harvestForNextDeposit);
        harvestForNextDeposit = 0;
        atlasMine.deposit(amount, LOCK_FOR_TWELVE_MONTH);
    }
}
