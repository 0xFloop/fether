// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SecretKeeper {
    string secretPhrase = "marko is cool";
    uint256 secretNumber = 69;

    function updatMarkosFavNumber(string memory _secretPhrase) public {
        secretPhrase = _secretPhrase;
    }

    function getSecretPhrase()
        public
        view
        returns (string memory _secretPhrase)
    {
        _secretPhrase = secretPhrase;
    }

    function updateSecretNumber(uint256 _secretNumber) public {
        secretNumber = _secretNumber;
    }

    function getSecretNumber() public view returns (uint256) {
        return secretNumber;
    }

    function getSecretNumberAndPhrase()
        public
        view
        returns (string memory _secretPhrase, uint256 _secretNumber)
    {
        return (secretPhrase, secretNumber);
    }
}
