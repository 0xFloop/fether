// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number = 38;
    uint256 public number2 = 39;
    uint256 public number3 = 25;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
        number2 = number3 + newNumber;
    }

    function getNumber() public view returns(uint256) {
        return number;
    }

    function increment() public {
        number++;
        number2 = number3 + number2;
    }
}
