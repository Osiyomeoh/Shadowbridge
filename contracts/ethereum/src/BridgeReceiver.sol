// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BridgeReceiver is ReentrancyGuard, Ownable {
    IERC20 public immutable wrappedToken;
    address public relayer;
    
    mapping(bytes32 => bool) public processedMessages;
    
    uint256 public totalTransactions;
    uint256 public totalVolume;
    
    event TokensMinted(
        address indexed recipient,
        uint256 amount,
        bytes32 indexed messageHash,
        uint256 timestamp
    );
    
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    
    constructor(
        address _wrappedToken,
        address _relayer,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_wrappedToken != address(0), "Invalid token");
        require(_relayer != address(0), "Invalid relayer");
        
        wrappedToken = IERC20(_wrappedToken);
        relayer = _relayer;
    }
    
    function processCrossChainTransfer(
        address recipient,
        uint256 amount,
        bytes32 messageHash,
        bytes calldata proof
    ) external nonReentrant {
        require(msg.sender == relayer, "Not relayer");
        require(!processedMessages[messageHash], "Already processed");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        processedMessages[messageHash] = true;
        totalTransactions++;
        totalVolume += amount;
        
        require(wrappedToken.transfer(recipient, amount), "Transfer failed");
        
        emit TokensMinted(recipient, amount, messageHash, block.timestamp);
    }
    
    function updateRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Invalid address");
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }
    
    function getStats() external view returns (uint256, uint256) {
        return (totalTransactions, totalVolume);
    }
}
