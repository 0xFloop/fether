// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecretKeeper is Ownable {
    string public secretPhrase = "ty is cool";
    uint256 public secretNumber = 69420;
    SecretStorage public secretInStorage =
        SecretStorage(1010, "super duper secret ForTY");

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

    function updateSecretInStorageForTY(
        SecretStorage memory secretParam
    ) public {
        secretInStorage = secretParam;
    }

    function updateSecretNumberForTY(uint256 _secretNumber) public {
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
