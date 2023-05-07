import { Chain } from "wagmi";
import { ExtractAbiFunctionNames, Narrow } from "abitype";
import { AbiFunction } from "abitype";

export default class Fether {
  chain: Chain;
  key: string;
  methods: { [key: string]: string };
  abi: Narrow<
    | {
        inputs: never[];
        name: string;
        outputs: {
          internalType: string;
          name: string;
          type: string;
        }[];
        stateMutability: string;
        type: string;
      }
    | {
        inputs: {
          internalType: string;
          name: string;
          type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
      }
  >[];
  address: `0x${string}`;

  constructor(API_KEY: string) {
    this.key = API_KEY;
    this.chain = {
      id: 696969,
      name: "Fether",
      network: "fether",
      nativeCurrency: {
        decimals: 18,
        name: "Fether",
        symbol: "FEth",
      },
      rpcUrls: {
        default: { http: [`https://fether-testing.ngrok.app/rpc/${this.key}`] },
        public: { http: [`https://fether-testing.ngrok.app/rpc/${this.key}`] },
      },
      testnet: false,
    };
    this.address = "0x";
    this.abi = [];
    this.methods = {};
  }
  async init() {
    console.log("key from fetherKit" + this.key);
    let data = await fetch(`https://fether-testing.ngrok.app/fetherkit/${this.key}`).then((res) =>
      res.json()
    );
    const _abi = JSON.parse(data.contractAbi);

    this.abi = _abi;

    this.abi.map((method) => {
      let name = method.name;
      this.methods[name] = name;
    });

    this.address = data.contractAddress;
  }
}
