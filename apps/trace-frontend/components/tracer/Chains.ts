import React from 'react';

export type ChainConfig = {
    chainId: number;
    id: string;
    displayName: string;
    nativeTokenAddress: string;
    nativeSymbol: string;
    coingeckoId: string;
    defillamaPrefix: string;
    rpcUrl: string;
    blockexplorerUrl: string;
};

export const SupportedChains = [
    {
        chainId: 696969,
        id: 'fether',
        displayName: 'fether',
        nativeTokenAddress: '0x6eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        nativeSymbol: 'FEth',
        coingeckoId: 'coingecko:feth',
        defillamaPrefix: 'feth',
        rpcUrl: `https://fether-testing.ngrok.app/rpc/${process.env.API_KEY}`,
        blockexplorerUrl: 'https://ftmscan.com',
    },
];

const conduitAPIs: { [key: string]: string } = {
    conduit: 'https://api.exfac.xyz/txTracer/chainConfig/',
    'conduit-staging': 'https://api.staging.exfac.xyz/txTracer/chainConfig/',
    'conduit-localhost': 'http://localhost:8080/txTracer/chainConfig/',
};

export const getChain = async (id: string): Promise<ChainConfig | undefined> => {
    if (id.startsWith('conduit:') || id.startsWith('conduit-staging:') || id.startsWith('conduit-localhost:')) {
        const tokens = id.split(':');
        if (tokens.length != 2) {
            return undefined;
        }

        const prefix = tokens[0];
        const slug = tokens[1];

        try {
            let resp = await fetch(conduitAPIs[prefix] + slug);
            let json = await resp.json();
            return json as ChainConfig;
        } catch (error) {
            console.log(error);
        }
        return undefined;
    }
    return SupportedChains.find((chain) => chain.id === id);
};

export const defaultChainConfig = (): ChainConfig => {
    return SupportedChains[0];
};

export const ChainConfigContext = React.createContext(defaultChainConfig());
