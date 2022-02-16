// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

struct AtlasDeposit {
    uint256 depositId;
    uint256 activationTimestamp;
    uint256 accumulatedMagic;
    uint256 withdrawTimestamp;
    uint256 mintedShares;
    bool exists;
    bool isActive;
    mapping(address => uint256) depositedMagicPerAddress;
}

library AtlasDepositLibrary {
    function increaseMagic(
        AtlasDeposit storage deposit,
        uint256 amount,
        address to
    ) internal {
        deposit.accumulatedMagic += amount;
        deposit.depositedMagicPerAddress[to] += amount;
    }
}
