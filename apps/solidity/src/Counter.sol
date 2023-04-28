// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number = 67;
    uint256 public number2 = 56;
    uint256 public number3 = 25;

    function setLeNumber(uint256 newNumber) public {
        number = newNumber;
        number2 = number3 + newNumber;
    }

    function getLeNumber() public view returns (uint256) {
        return number;
    }

    function incrementLeNumbers() public {
        number++;
        number2 = number3 + number2;
    }
}
