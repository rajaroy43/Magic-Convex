// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MagicDepositorConfig is OwnableUpgradeable {
    event UpdatedConfiguration(uint256 stakeRewardSplit, address treasury, address staking);

    /** Constants */
    uint256 private constant PRECISION = 1e18;

    /** Config variables */
    uint256 internal stakeRewardSplit; // Proportion of harvest that is going to stake rewards, the remaing is got to treasury
    address internal treasury; // Address of the treasury
    address internal staking; // Address of the staking contract

    /** ACCESS-CONTROLLED FUNCTIONS */

    function setConfig(
        uint256 _stakeRewardSplit,
        address _treasury,
        address _staking
    ) external onlyOwner {
        require(_stakeRewardSplit <= PRECISION, "Invalid split config");
        require(_treasury != address(0), "Invalid treasury addr");
        require(_staking != address(0), "Invalid staking addr");

        stakeRewardSplit = _stakeRewardSplit;
        treasury = _treasury;
        staking = _staking;

        emit UpdatedConfiguration(_stakeRewardSplit, _treasury, _staking);
    }

    /** VIEW FUNCTIONS */

    function getConfig()
        external
        view
        returns (
            uint256,
            address,
            address
        )
    {
        return (stakeRewardSplit, treasury, staking);
    }
}
