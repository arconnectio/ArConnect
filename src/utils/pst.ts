import axios from "axios";

// ArDrive Profit Sharing Community Smart Contract
const cachedContractURL =
  "https://v2.cache.verto.exchange/-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ";

// Calls the ArDrive Community Smart Contract to pull the fee
// A return value of .15 means that the retrieved tip setting is 15% of the data upload cost.
export async function getArDriveTipPercentage(): Promise<number> {
  try {
    const res = (await axios.get(cachedContractURL)).data;

    const arDriveCommunityFee = res.state.settings.find(
      (setting: (string | number)[]) =>
        setting[0].toString().toLowerCase() === "fee"
    );
    return arDriveCommunityFee ? arDriveCommunityFee[1] / 100 : 0.15;
  } catch {
    return 0.15; // Default fee of 15% if we cannot pull it from the community contract
  }
}

// Gets a random ArDrive token holder based off their weight (amount of tokens they hold)
export async function selectTokenHolder(): Promise<string | undefined> {
  // Read the ArDrive Smart Contract to get the latest state
  const res = (await axios.get(cachedContractURL)).data;
  const balances = res.state.balances;
  const vault = res.state.vault;

  // Get the total number of tokens
  let totalTokens = 0;
  for (const addr of Object.keys(balances)) {
    totalTokens += balances[addr];
  }

  // Check for how many tokens the user has staked/vaulted
  for (const addr of Object.keys(vault)) {
    if (!vault[addr].length) continue;

    const vaultBalance = vault[addr]
      .map((a: { balance: number; start: number; end: number }) => a.balance)
      .reduce((a: number, b: number) => a + b, 0);

    totalTokens += vaultBalance;

    if (addr in balances) {
      balances[addr] += vaultBalance;
    } else {
      balances[addr] = vaultBalance;
    }
  }

  // Create a weighted list of token holders
  const weighted: { [addr: string]: number } = {};
  for (const addr of Object.keys(balances)) {
    weighted[addr] = balances[addr] / totalTokens;
  }
  // Get a random holder based off of the weighted list of holders
  const randomHolder = weightedRandom(weighted);
  return randomHolder;
}

// Gets a random ardrive wallet, but each wallet has a weight of the tokens it has,
// A wallet with a higher number of tokens has a higher probability of being returned.
export function weightedRandom(
  dict: Record<string, number>
): string | undefined {
  let sum = 0;
  const r = Math.random();

  for (const addr of Object.keys(dict)) {
    sum += dict[addr];
    if (r <= sum && dict[addr] > 0) {
      return addr;
    }
  }
  return;
}
export async function getWinstonPriceForByteCount(
  byteCount: number
): Promise<number> {
  const response = await fetch(`https://arweave.net/price/${byteCount}`);
  const winstonAsString = await response.text();
  return +winstonAsString;
}
