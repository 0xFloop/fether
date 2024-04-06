// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecretKeeper is Ownable {
    string public secretPhrase;
    uint256 public secretNumber;
    SecretStorage public secretInStorage =
        SecretStorage(6969, "doopeererererererererererasdsdafsdasdfasderefse");

    struct SecretStorage {
        uint secretNumber;
        string secretPrase;
    }

    constructor(uint256 startNum, string memory startPhrase) {
        secretNumber = startNum;
        secretPhrase = startPhrase;
    }

    function updateSecretPhraseSauze(string memory _secretPhrase) public {
        secretPhrase = _secretPhrase;
    }

    function getConcatPhrase(
        string memory _secretPhrase
    ) public view returns (string memory _secretConcatPhrase) {
        _secretConcatPhrase = string.concat(secretPhrase, _secretPhrase);
    }

    function getSecretPhrase()
        public
        view
        returns (string memory _secretPhrase)
    {
        _secretPhrase = secretPhrase;
    }

    function updateSecretInStorage(
        SecretStorage memory secretParam
    ) public returns (string memory _secretPhrase, uint256 _secretNumber) {
        _secretNumber = secretParam.secretNumber;
        _secretPhrase = secretParam.secretPrase;
        secretInStorage = secretParam;
    }

    function writeWith1Return(
        SecretStorage memory secretParam
    ) public returns (string memory _secretPhrase) {
        _secretPhrase = secretParam.secretPrase;
        secretInStorage = secretParam;
    }

    function updateSecretNumber(uint256 _secretNumber) public {
        secretNumber = _secretNumber;
    }

    function getMaisiesNumber() public view returns (uint256) {
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
