export interface Gateway {
  host: string;
  port: number;
  protocol: "http" | "https";
}

/**
 * Well-known gateways
 */
export const suggestedGateways: Gateway[] = [
  {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "ar-io.net",
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
    protocol: "https"
  }
];

export const testnets: Gateway[] = [
  {
    host: "www.arweave.run",
    port: 443,
    protocol: "https"
  },
  {
    host: "testnet.redstone.tools",
    port: 443,
    protocol: "https"
  }
];

export const defaultGateway = suggestedGateways[0];
