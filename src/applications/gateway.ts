export interface Gateway {
  host: string;
  port: number;
  protocol: "http" | "https";
}

export const defaultGateway: Gateway = {
  host: "arweave.net",
  port: 443,
  protocol: "https"
};
