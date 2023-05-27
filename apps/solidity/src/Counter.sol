// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 number = 84;
    string letter = "A";

    function setLeNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function setNumberAndLetter(
        uint256 newNumber,
        string memory newString
    ) public {
        number = newNumber;
        letter = newString;
    }

    function getLeNumber() public view returns (uint256) {
        return number;
    }

    function getNumberAndLetter() public view returns (string memory, uint256) {
        return (letter, number);
    }

    function incrementLeNumbers() public {
        number++;
    }
}
