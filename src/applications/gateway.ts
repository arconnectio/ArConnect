import type GQLResultInterface from "ar-gql/dist/faces";
import type Application from "./application";

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

/**
 * Get the full gateway URL string, from the
 * provided gateway config.
 * This should be used for the UX, with the
 * redux gateway config reducer.
 */
export const concatGatewayURL = (gatewayConfig: Gateway) =>
  `${gatewayConfig.protocol}://${gatewayConfig.host}:${gatewayConfig.port}`;

/**
 * Get the full gateway URL string, from the
 * extension storage. This should only be used
 * for background scripts, not for the UX.
 * The UX should use the redux gateway config
 * reducer and concat the gateway URL from there.
 *
 * @returns Gateway URL
 */
export async function gatewayURL(app: Application) {
  const gatewayConfig = await app.getGatewayConfig();

  return concatGatewayURL(gatewayConfig);
}

/**
 * Run a query on the Arweave Graphql API,
 * using the configured gateway
 *
 * @param query The query string to run
 * @param variables GQL variables to pass
 *
 * @returns Query result
 */
export async function gql(
  query: string,
  variables?: Record<string, unknown>,
  gateway?: Gateway
) {
  const gatewayUrl = concatGatewayURL(gateway || defaultGateway);
  const graphql = JSON.stringify({
    query,
    variables
  });

  // execute the query
  const data: GQLResultInterface = await (
    await fetch(gatewayUrl + "/graphql", {
      method: "post",
      body: graphql,
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      }
    })
  ).json();

  return data;
}

export function urlToGateway(url: string): Gateway {
  const gatewayURL = new URL(url);

  return {
    host: gatewayURL.hostname,
    port: gatewayURL.port === "" ? 443 : Number(gatewayURL.port),
    // @ts-expect-error
    protocol: gatewayURL.protocol?.replace(":", "") || "http"
  };
}
