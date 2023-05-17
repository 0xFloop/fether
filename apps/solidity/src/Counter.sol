// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number = 79;
    uint256 public number2 = 73;
    uint256 public number3 = 25;

    function setOwensNumber(uint256 newNumber) public {
        number = newNumber;
        number2 = number3 + newNumber;
    }

    function getOwensNumber() public view returns (uint256) {
        return number;
    }

    function incrementLeNumbers() public {
        number++;
        number2 = number3 + number2;
    }
}
