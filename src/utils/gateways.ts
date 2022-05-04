import { IGatewayConfig } from "../stores/reducers/arweave";

/**
 * Well-known gateways
 */
export const suggestedGateways: SuggestedGateway[] = [
  {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "arweave.dev",
    port: 443,
    protocol: "https"
  },
  {
    host: "arweave.live",
    port: 443,
    protocol: "https",
    note: "WIP"
  },
  {
    host: "www.arweave.run",
    port: 443,
    protocol: "https",
    note: "TESTNET"
  },
  {
    host: "testnet.redstone.tools",
    port: 443,
    protocol: "https",
    note: "TESTNET"
  }
];

export interface SuggestedGateway extends IGatewayConfig {
  note?: string;
}
