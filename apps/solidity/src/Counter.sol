// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number = 421;
    uint256 public number2 = 43;
    uint256 public number3 = 25;

    function setTheNumber(uint256 newNumber) public {
        number = newNumber;
        number2 = number3 + newNumber;
    }

    function getTheNumber() public view returns(uint256) {
        return number;
    }

    function incrementTheNumbers() public {
        number++;
        number2 = number3 + number2;
    }
}
