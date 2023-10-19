// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecretKeeper is Ownable {
    string public maisiesHatersSecretPhrase =
        "maisie IS NOT very super duper very ultra mega is the NOT super best";
    uint256 public secretNumber = 10;
    SecretStorage public secretInStorage = SecretStorage(6969, "maisies nuts");

    struct SecretStorage {
        uint secretNumber;
        string secretPrase;
    }

    function updateSecretPhraseForMaisiesHaters(
        string memory _secretPhrase
    ) public {
        maisiesHatersSecretPhrase = _secretPhrase;
    }

    function getSecretPhrase()
        public
        view
        returns (string memory _secretPhrase)
    {
        _secretPhrase = maisiesHatersSecretPhrase;
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
        return (maisiesHatersSecretPhrase, secretNumber);
    }
}
