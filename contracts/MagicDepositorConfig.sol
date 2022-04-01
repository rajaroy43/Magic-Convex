// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MagicDepositorConfig is OwnableUpgradeable {
    event UpdatedConfiguration(
        uint256 stakeRewardSplit,
        uint256 treasurySplit,
        address treasury,
        address staking
    );

    /** Config variables */
    uint128 internal stakeRewardSplit; // Proportion of harvest that is going to stake rewards
    uint128 internal treasurySplit; // Proportion of harvest that goes to the treasury
    address internal treasury; // Address of the treasury
    address internal staking; // Address of the staking contract

    /** ACCESS-CONTROLLED FUNCTIONS */

    function setConfig(
        uint128 _stakeRewardSplit,
        uint128 _treasurySplit,
        address _treasury,
        address _staking
    ) external onlyOwner {
        require(_stakeRewardSplit + _treasurySplit <= 1 ether, "Invalid split config");
        require(_treasury != address(0), "Invalid treasury addr");
        require(_staking != address(0), "Invalid staking addr");

        stakeRewardSplit = _stakeRewardSplit;
        treasurySplit = _treasurySplit;
        treasury = _treasury;
        staking = _staking;

        emit UpdatedConfiguration(_stakeRewardSplit, _treasurySplit, _treasury, _staking);
    }

    /** VIEW FUNCTIONS */

    function getConfig()
        external
        view
        returns (
            uint128,
            uint128,
            address,
            address
        )
    {
        return (stakeRewardSplit, treasurySplit, treasury, staking);
    }
}
