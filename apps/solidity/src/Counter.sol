// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 number = 69;
    string letter = "F";

    function setLeNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function setNumberAndLetterHiElena(
        uint256 newNumber,
        string memory newString
    ) public {
        number = newNumber;
        letter = newString;
    }

    function getLeNumberFromElena() public view returns (uint256 _number) {
        return number;
    }

    function getNumberAndLetter()
        public
        view
        returns (string memory _letter, uint256 _number)
    {
        return (letter, number);
    }

    function incrementLeNumbers() public {
        number++;
    }
}
