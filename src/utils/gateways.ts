import { IGatewayConfig } from "../stores/reducers/arweave";
import { getArweaveConfig } from "./background";
import GQLResultInterface from "ar-gql/dist/faces";
import axios from "axios";

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

/**
 * Get the full gateway URL string, from the
 * extension storage. This should only be used
 * for background scripts, not for the UX.
 * The UX should use the redux gateway config
 * reducer and concat the gateway URL from there.
 *
 * @returns Gateway URL
 */
export async function gatewayURL() {
  const gatewayConfig = await getArweaveConfig();

  return concatGatewayURL(gatewayConfig);
}

/**
 * Get the full gateway URL string, from the
 * provided gateway config.
 * This should be used for the UX, with the
 * redux gateway config reducer.
 */
export const concatGatewayURL = (gatewayConfig: IGatewayConfig) =>
  `${gatewayConfig.protocol}://${gatewayConfig.host}:${gatewayConfig.port}`;

/**
 * Run a query on the Arweave Graphql API,
 * using the configured gateway
 *
 * @param query The query string to run
 * @param variables GQL variables to pass
 *
 * @returns Query result
 */
export async function gql(query: string, variables?: Record<string, unknown>) {
  const gateway = await gatewayURL();
  const graphql = JSON.stringify({
    query,
    variables
  });

  // execute the query
  const { data } = await axios.post<GQLResultInterface>(
    gateway + "/graphql",
    graphql,
    {
      headers: {
        "content-type": "application/json"
      }
    }
  );

  return data;
}
