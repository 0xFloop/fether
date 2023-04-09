import { Chain } from "wagmi";

export default class Fether {
  chain: Chain;
  key: string;
  abi: {}[];
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
  }
  async init() {
    let data = await fetch(`https://fether-testing.ngrok.app/fetherkit/${this.key}`).then((res) =>
      res.json()
    );
    this.abi = JSON.parse(data.contractAbi);
    this.address = data.contractAddress;
  }
}
