// SPDX-License-Identifier: MIT
// Taken from Sushiswap 's xSUSHI: https://etherscan.io/address/0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272
pragma solidity ^0.8.11;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract xmgMagicToken is ERC20("Staked mgMagic", "xmgMagic") {
    IERC20 public mgMagic;

    constructor(IERC20 _mgMagic) {
        mgMagic = _mgMagic;
    }

    function enter(uint256 _amount) public {
        uint256 totalMgMagic = mgMagic.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalMgMagic == 0) {
            _mint(msg.sender, _amount);
        } else {
            uint256 what = (_amount * totalShares) / totalMgMagic;
            _mint(msg.sender, what);
        }
        mgMagic.transferFrom(msg.sender, address(this), _amount);
    }

    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint256 what = (_share * mgMagic.balanceOf(address(this))) / totalShares;
        _burn(msg.sender, _share);
        mgMagic.transfer(msg.sender, what);
    }
}
