// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CGOVToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("Campus Governance Token", "CGOV")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}