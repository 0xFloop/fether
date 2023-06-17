import { Ethereum } from "@wagmi/core";
import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  custom,
  http,
  parseEther,
} from "viem";
import { useFether } from "fetherkit";

export default function Index() {
  const fether = useFether();
  const [number, setNumber] = useState<number>();
  const [windowEthereum, setWindowEthereum] = useState<Ethereum>();

  let publicClient = createPublicClient({
    chain: fether.chain,
    transport: http(),
  });

  const updateStateNumber = async () => {
    const number = await publicClient.readContract({
      address: fether.address,
      abi: fether.abi,
      functionName: "getLeNumber",
    });
    setNumber(Number(number));
  };

  const sendContractTransaction = async (newNum: number) => {
    let adminClient = createTestClient({
      chain: fether.chain,
      mode: "anvil",
      transport: http(),
    });

    await adminClient.setBalance({
      address: "0xDA1B24C1eb29DC9Fe733EE93a5d4ff727Cc4ea7f",
      value: parseEther("1"),
    });

    let walletClient = createWalletClient({
      chain: fether.chain,
      transport: custom(windowEthereum as Ethereum),
    });

    const [address] = await walletClient.getAddresses();

    const { request } = await publicClient.simulateContract({
      account: address,
      address: fether.address,
      abi: fether.abi,
      functionName: fether.methods.setLeNumber,
      args: [newNum],
    });
    let tx = await walletClient.writeContract(request);
    console.log(tx);
  };

  return (
    <div>
      <ConnectKitButton />
      <button onClick={updateStateNumber}>click to get contract number value</button>
      <br />
      <br />
      <p>contract number {number}</p>
      <p>contract address {fether.address}</p>
      <p>All abi methods listed below</p>
      <ul>
        {fether.abi.map((method) => (
          <li key={method.name}>{JSON.stringify(method["name"])}</li>
        ))}{" "}
      </ul>
      <input type="number" id="numInput" placeholder="new button number" />
      <button
        onClick={async () => {
          let newNum = parseInt((document.getElementById("numInput") as HTMLInputElement).value);
          console.log(newNum);
          await sendContractTransaction(
            parseInt((document.getElementById("numInput") as HTMLInputElement).value) ?? 0
          );
        }}
      >
        click to get update number
      </button>
    </div>
  );
}
