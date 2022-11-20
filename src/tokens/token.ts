import { concatGatewayURL, Gateway, gql } from "~applications/gateway";

export interface Token {
  id: string;
  name?: string;
  ticker: string;
  balance: number;
}

export interface TokenState {
  name?: string;
  ticker: string;
  balances: Record<string, number>;
  [key: string]: any;
}

/**
 * Check if a contract state is a
 * valid token state
 */
export function validateTokenState(state: TokenState) {
  if (!state) {
    throw new Error("No state for token");
  }

  if (!state.ticker || typeof state.ticker !== "string") {
    throw new Error("Invalid ticker");
  }

  if (!state.balances) {
    throw new Error("No balances object");
  }

  for (const address in state.balances) {
    if (typeof address !== "string") {
      throw new Error(
        "Balances object contains an invalid address that is not a string"
      );
    }

    if (typeof state.balances[address] !== "number") {
      throw new Error(
        "Balances object contains an invalid balance that is not a number"
      );
    }
  }
}

/**
 * Get the initial state of a contract
 *
 * @param id Contract ID
 * @param gateway Gateway to fetch from
 */
export async function getInitialState(
  id: string,
  gateway: Gateway
): Promise<Record<any, any>> {
  const { data } = await gql(
    `query ($id: ID!) {
      transaction (id: $id) {
        tags {
          name
          value
        }
      }
    }`,
    { id },
    gateway
  );

  // init state tag
  const initState = data.transaction.tags.find(
    ({ name }) => name === "Init-State"
  )?.value;

  if (initState) {
    return JSON.parse(initState);
  }

  // init state tx tag
  const initStateTx = data.transaction.tags.find(
    ({ name }) => name === "Init-State-TX"
  )?.value;

  if (initStateTx) {
    const initState = await (
      await fetch(`${concatGatewayURL(gateway)}/${initStateTx}`)
    ).json();

    return initState;
  }

  // otherwise get the data of the contract tx
  const contractData = await (
    await fetch(`${concatGatewayURL(gateway)}/${id}`)
  ).json();

  return contractData;
}
