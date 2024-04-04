// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    uint256 number = 6969;
    string letter = "leedlelelelelel";

    function setTheNumberDevBranch(uint256 newNumber) public {
        number = newNumber;
    }

    function setNumberAndLetterDevBranch(
        uint256 newNumber,
        string memory newString
    ) public {
        number = newNumber;
        letter = newString;
    }

    function getLeNumberDevBranch() public view returns (uint256 _number) {
        return number;
    }

    function getNumberAndLetterDevBranch()
        public
        view
        returns (string memory _letter, uint256 _number)
    {
        return (letter, number);
    }

    function incrementLeNumbersDevBranch() public {
        number++;
    }
}
