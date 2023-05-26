// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 public number = 84;
    uint256 public number2 = 73;
    uint256 public number3 = 25;
    string public letter = "A";

    function setOwensNumber(uint256 newNumber) public {
        number = newNumber;
        number2 = number3 + newNumber;
    }

    function setNumberAndLetter(
        uint256 newNumber,
        string memory newString
    ) public {
        number = newNumber;
        letter = newString;
    }

    function getOwensNumber() public view returns (uint256) {
        return number;
    }

    function getNumberAndLetter() public view returns (string memory, uint256) {
        return (letter, number);
    }

    function incrementLeNumbers() public {
        number++;
        number2 = number3 + number2;
    }
}
