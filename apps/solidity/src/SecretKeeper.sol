// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecretKeeper is Ownable {
    string public secretPhrase = "testing turbo-ignore again";
    uint256 public secretNumber = 345;
    SecretStorage public secretInStorage = SecretStorage(999, "super secret");

    struct SecretStorage {
        uint secretNumber;
        string secretPrase;
    }

    function updateSecretPhrase(string memory _secretPhrase) public {
        secretPhrase = _secretPhrase;
    }

    function getSecretPhrase()
        public
        view
        returns (string memory _secretPhrase)
    {
        _secretPhrase = secretPhrase;
    }

    function updateSecretInStorage(SecretStorage memory secretParam) public {
        secretInStorage = secretParam;
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
