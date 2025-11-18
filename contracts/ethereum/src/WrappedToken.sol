// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedToken is ERC20, Ownable {
    address public bridge;
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    
    constructor(address initialOwner) ERC20("Wrapped USDC", "wUSDC") Ownable(initialOwner) {}
    
    function mint(address to, uint256 amount) external {
        if (bridge == address(0)) {
            require(msg.sender == owner(), "Not owner");
        } else {
            require(msg.sender == bridge, "Not bridge");
        }
        require(to != address(0), "Invalid recipient");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
    }
    
    function setBridge(address newBridge) external onlyOwner {
        require(newBridge != address(0), "Invalid bridge");
        address oldBridge = bridge;
        bridge = newBridge;
        emit BridgeUpdated(oldBridge, newBridge);
    }
}
