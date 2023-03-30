// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number = 25;

    function setDigit(uint256 newNumber) public {
        number = newNumber;
    }

    function increase() public {
        number++;
    }
}
