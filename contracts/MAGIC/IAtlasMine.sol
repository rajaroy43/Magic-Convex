// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

interface IAtlasMine {
    function deposit(uint256 amount, uint8 lockEnum) external;

    function harvestAll() external;

    function getAllUserDepositIds(address _user) external view returns (uint256[] memory);

    function withdrawPosition(uint256 _depositId, uint256 _amount) external returns (bool);

    function userInfo(address, uint256)
        external
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            int256,
            uint8
        );
}
