// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Legion is ERC721 {
    constructor() ERC721("Legion", "LG") {}

    function mint(address to, uint256 id) public {
        _mint(to, id);
    }
}
