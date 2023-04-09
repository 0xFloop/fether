"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Fether {
    constructor(API_KEY) {
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
                default: { http: [`https://fether-testing.ngrok.app/fetherkit/${this.key}`] },
                public: { http: [`https://fether-testing.ngrok.app/fetherkit/${this.key}`] },
            },
            testnet: false,
        };
        this.address = "0x";
        this.abi = [];
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield fetch(`https://fether-testing.ngrok.app/fetherkit/${this.key}`).then((res) => res.json());
            this.abi = data.contractAbi;
            this.address = data.contractAddress;
        });
    }
}
exports.default = Fether;
