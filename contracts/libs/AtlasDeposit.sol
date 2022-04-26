// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

struct AtlasDeposit {
    uint256 activationTimestamp;
    uint256 accumulatedMagic;
    bool isActive;
    mapping(address => uint256) depositedMagicPerAddress;
    mapping(address => bool) stakeOnClaim;
}

library AtlasDepositLibrary {
    function increaseMagic(
        AtlasDeposit storage deposit,
        uint256 amount,
        address to,
        bool stakeOnClaim
    ) internal {
        deposit.accumulatedMagic += amount;
        deposit.depositedMagicPerAddress[to] += amount;
        deposit.stakeOnClaim[to] = stakeOnClaim;
    }

    function canBeActivated(AtlasDeposit storage deposit) internal view returns (bool) {
        return deposit.activationTimestamp < block.timestamp;
    }
}
