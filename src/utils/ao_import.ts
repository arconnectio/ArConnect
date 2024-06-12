import { ExtensionStorage } from "./storage";
import { getAoTokens } from "~tokens";
import { getTagValue, type Message, type TokenInfo } from "~tokens/aoTokens/ao";

const AO_NATIVE_TOKEN_REGISTRY = "Q2ri6Yl0wCIekTrVE0R6fQ9TT6ZlI7yIOPBnJsBhMzk";
const AO_NATIVE_TOKEN_IMPORTED = "ao_native_token_imported";
const AO_TOKENS = "ao_tokens";
const AO_NATIVE_TOKEN = "ao_native_token";
let isImporting = false;

async function getTokenInfo(id: string): Promise<TokenInfo> {
  const body = {
    Id: "0000000000000000000000000000000000000000001",
    Target: id,
    Owner: "0000000000000000000000000000000000000000002",
    Anchor: "0",
    Data: "1234",
    Tags: [
      { name: "Action", value: "Info" },
      { name: "Data-Protocol", value: "ao" },
      { name: "Type", value: "Message" },
      { name: "Variant", value: "ao.TN.1" }
    ]
  };
  const res = await (
    await fetch(`https://cu.ao-testnet.xyz/dry-run?process-id=${id}`, {
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      method: "POST"
    })
  ).json();

  // find message with token info
  for (const msg of res.Messages as Message[]) {
    const Ticker = getTagValue("Ticker", msg.Tags);
    const Name = getTagValue("Name", msg.Tags);
    const Denomination = getTagValue("Denomination", msg.Tags);
    const Logo = getTagValue("Logo", msg.Tags);
    const processId = getTagValue("Process-Id", msg.Tags);

    if (!Ticker && !Name) continue;

    // if the message was found, return the token details
    return {
      Name,
      Ticker,
      Denomination: Number(Denomination || 0),
      Logo,
      processId
    };
  }

  throw new Error("Could not load token info.");
}

export async function importAoNativeToken() {
  try {
    if (isImporting) return;
    isImporting = true;

    // check if ao native token is already imported
    const aoTokenImported = await ExtensionStorage.get<boolean>(
      AO_NATIVE_TOKEN_IMPORTED
    );
    if (aoTokenImported) return;

    // check if there is a valid ao native token
    const token = await getTokenInfo(AO_NATIVE_TOKEN_REGISTRY);
    if (!token?.Ticker || !token?.processId) return;

    // check if ao native token is already added
    const aoTokens = await getAoTokens();
    const isAoTokenPresent = aoTokens.some(
      (t) => t.processId === token.processId
    );
    if (isAoTokenPresent) {
      await ExtensionStorage.set(AO_NATIVE_TOKEN, token.processId);
      await ExtensionStorage.set(AO_NATIVE_TOKEN_IMPORTED, true);
      return;
    }

    // add ao native token to the first
    aoTokens.unshift({
      Name: token.Name,
      Ticker: token.Ticker,
      Denomination: token.Denomination,
      Logo: token.Logo,
      processId: token.processId
    });

    // set ao native token imported and updated ao tokens
    await ExtensionStorage.set(AO_NATIVE_TOKEN_IMPORTED, true);
    await ExtensionStorage.set(AO_TOKENS, aoTokens);
    await ExtensionStorage.set(AO_NATIVE_TOKEN, token.processId);
  } catch (e) {
    console.log("Error importing ao native token");
  } finally {
    isImporting = false;
  }
}
