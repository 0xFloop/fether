// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecretKeeper is Ownable {
    string public saucesSecretPhrase =
        "sauce very super duper very ultra is the super best";
    uint256 public secretNumber = 10;
    SecretStorage public secretInStorage = SecretStorage(6969, "deex nuts");

    struct SecretStorage {
        uint secretNumber;
        string secretPrase;
    }

    function updateSecretPhraseSauze(string memory _secretPhrase) public {
        saucesSecretPhrase = _secretPhrase;
    }

    function getSecretPhrase()
        public
        view
        returns (string memory _secretPhrase)
    {
        _secretPhrase = saucesSecretPhrase;
    }

    function updateSecretInStorage(SecretStorage memory secretParam) public {
        secretInStorage = secretParam;
    }

    function updateSecretNumber(uint256 _secretNumber) public {
        secretNumber = _secretNumber;
    }

    function getSaucesNumber() public view returns (uint256) {
        return secretNumber;
    }

    function getSecretNumberAndPhrase()
        public
        view
        returns (string memory _secretPhrase, uint256 _secretNumber)
    {
        return (saucesSecretPhrase, secretNumber);
    }
}
