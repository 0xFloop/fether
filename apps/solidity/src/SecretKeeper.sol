// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SecretKeeper {
    string secretPhrase = "helo henlo";
    uint256 secretNumber = 12;

    function updateJoesLeastrFavNumber(string memory _secretPhrase) public {
        secretPhrase = _secretPhrase;
    }

    function getSecretPhraseForJoe()
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
