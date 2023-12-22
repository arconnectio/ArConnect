export interface Gateway {
  host: string;
  port: number;
  protocol: string;
}

export const defaultGARCacheURL =
  "https://dev.arns.app/v1/contract/bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U/gateways";

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

export const fallbackGateway = {
  host: "ar-io.dev",
  port: 443,
  protocol: "https"
};

export const defaultGateway = suggestedGateways[0];
