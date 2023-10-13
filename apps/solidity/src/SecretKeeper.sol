// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecretKeeper is Ownable {
    string public tysSecretPhrase = "ty is mega cool";
    uint256 public secretNumber = 420;
    SecretStorage public secretInStorage = SecretStorage(6969, "deex nuts");

    struct SecretStorage {
        uint secretNumber;
        string secretPrase;
    }

    function updateSecretPhraseForTy(string memory _secretPhrase) public {
        tysSecretPhrase = _secretPhrase;
    }

    function getSecretPhrase()
        public
        view
        returns (string memory _secretPhrase)
    {
        _secretPhrase = tysSecretPhrase;
    }

    function updateSecretInStorage(SecretStorage memory secretParam) public {
        secretInStorage = secretParam;
    }

    function updateSecretNumber(uint256 _secretNumber) public {
        secretNumber = _secretNumber;
    }

    function getTysNumber() public view returns (uint256) {
        return secretNumber;
    }

    function getSecretNumberAndPhrase()
        public
        view
        returns (string memory _secretPhrase, uint256 _secretNumber)
    {
        return (tysSecretPhrase, secretNumber);
    }
}
