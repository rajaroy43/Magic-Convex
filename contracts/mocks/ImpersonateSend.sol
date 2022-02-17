// SPDX-License-Identifier: MIT

pragma solidity 0.8;

contract ImpersonateSend {
    constructor(address payable to) payable {
        selfdestruct(to);
    }
}
