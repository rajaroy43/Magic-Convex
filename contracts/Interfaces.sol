// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IRewards{
    function stake(address, uint256) external;
    function stakeFor(address, uint256) external;
    function queueNewRewards(uint256) external;
    function stakingToken() external returns (address);
    function rewardToken() external returns (address);
}

interface IMagicDepositor{
    function deposit(uint256) external;
    function depositFor(uint256 amount, address to) external;
    function claimMintedShares(uint256 atlasDepositIndex,bool stake) external returns (uint256);
    function earmarkRewards() external ;
    function update() external ;
    function getUserDepositedMagic(uint256 atlasDepositId, address user) external view returns (uint256);
}