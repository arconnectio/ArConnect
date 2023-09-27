import { concatGatewayURL } from "./utils";
import GQLResultInterface from "ar-gql/dist/faces";
import { defaultGateway, Gateway } from "./gateway";

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
