import { Chain } from "wagmi";
import { Narrow } from "abitype";
import React, { createContext, useContext, useEffect } from "react";

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
        default: { http: [`https://fether-server.vercel.app/rpc/${this.key}`] },
        public: { http: [`https://fether-server.vercel.app/rpc/${this.key}`] },
      },
      testnet: false,
    };
    this.address = "0x";
    this.abi = [];
    this.methods = {};
  }
  async init() {
    try {
      let data = await fetch(`https://fether-server.vercel.app/fetherkit/${this.key}`).then(
        async (res) => {
          if (res.status > 400) {
            throw new Error(await res.json());
          }
          return res.json();
        }
      );

      const _abi = JSON.parse(data.contractAbi);

      this.abi = _abi;

      this.abi.map((method) => {
        let name = method.name;
        this.methods[name] = name;
      });

      this.address = data.contractAddress;
    } catch (err) {
      console.error(err);
    }
  }
}

export function fetherChainFromKey(apikey: string): Chain {
  return {
    id: 696969,
    name: "Fether",
    network: "fether",
    nativeCurrency: {
      decimals: 18,
      name: "Fether",
      symbol: "FEth",
    },
    rpcUrls: {
      default: {
        http: [
          `https://${
            // process.env.NODE_ENV == "production"
            true ? "fether-server.vercel.app" : "fether-testing.ngrok.app"
          }/rpc/${apikey}`,
        ],
      },
      public: {
        http: [
          `https://${
            // process.env.NODE_ENV == "production"
            true ? "fether-server.vercel.app" : "fether-testing.ngrok.app"
          }/rpc/${apikey}`,
        ],
      },
    },
    testnet: false,
  };
}

export const BaseFetherChain: Chain = {
  id: 696969,
  name: "Fether",
  network: "fether",
  nativeCurrency: {
    decimals: 18,
    name: "Fether",
    symbol: "FEth",
  },
  rpcUrls: {
    default: {
      http: [
        `https://${
          // process.env.NODE_ENV == "production"
          true ? "fether-server.vercel.app" : "fether-testing.ngrok.app"
        }/rpc/GlobalLoader`,
      ],
    },
    public: {
      http: [
        `https://${
          // process.env.NODE_ENV == "production"
          true ? "fether-server.vercel.app" : "fether-testing.ngrok.app"
        }/rpc/GlobalLoader`,
      ],
    },
  },
  testnet: false,
};

export const FetherContext = createContext<Fether>({
  chain: BaseFetherChain,
  key: "",
  methods: {},
  abi: [],
  address: "0x",
  init: async () => {},
});

export function useFether() {
  return useContext(FetherContext);
}

interface FetherProviderProps {
  children: React.ReactNode;
  apiKey: string;
}

export function FetherProvider(props: FetherProviderProps) {
  const fetherInstance = new Fether(props.apiKey);

  useEffect(() => {
    fetherInstance.init();
  }, []);

  return (
    <div>
      <FetherContext.Provider value={fetherInstance}>{props.children}</FetherContext.Provider>
    </div>
  );
}
