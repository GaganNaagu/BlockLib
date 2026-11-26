// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title TestConnection
 * @notice Minimal Phase 2 contract used to verify local Hardhat deployment,
 *         transaction signing, receipt confirmation, and ABI/address export.
 */
contract TestConnection {
    string public lastMessage;
    uint256 public pingCount;

    event Pinged(address indexed sender, string message, uint256 count, uint256 timestamp);

    function ping(string calldata message) external {
        pingCount += 1;
        lastMessage = message;
        emit Pinged(msg.sender, message, pingCount, block.timestamp);
    }
}
