import Arweave from "arweave";
import { readContract } from "smartweave/lib/contract-read";

// Initialise an Arweave client using the default options.
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
  logging: false
});

const pstContractId = "-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ";

// Read the PST contract state and cache it for the life of the script.
const pstContractStateRead = readContract(arweave, pstContractId);
// Start loading the contract state early so the functions above can access the state faster.
(async () => {
  await pstContractStateRead;
})();
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

export async function getWeightedPstHolder(): Promise<string | undefined> {
  const state = await pstContractStateRead;
  const balances = state.balances;
  const vault = state.vault;
  console.dir(state);
  let total = 0;
  for (const addr of Object.keys(balances)) {
    total += balances[addr];
  }
  for (const addr of Object.keys(vault)) {
    if (!vault[addr].length) continue;
    const vaultBalance = vault[addr]
      .map((a: { balance: number; start: number; end: number }) => a.balance)
      .reduce((a: number, b: number) => a + b, 0);
    total += vaultBalance;
    if (addr in balances) {
      balances[addr] += vaultBalance;
    } else {
      balances[addr] = vaultBalance;
    }
  }
  const weighted: { [addr: string]: number } = {};
  for (const addr of Object.keys(balances)) {
    weighted[addr] = balances[addr] / total;
  }
  const randomHolder = weightedRandom(weighted);
  return randomHolder;
}
// Gets the price of AR based on amount of data
export async function getWinston(bytes: number): Promise<number> {
  const response = await fetch(`https://arweave.net/price/${bytes}`);
  // const response = await fetch(`https://perma.online/price/${bytes}`);
  const winston = await response.json();
  return winston;
}
// Calls the ArDrive Community Smart Contract to pull the fee
export async function getArDriveFee(): Promise<number> {
  try {
    const contract = await pstContractStateRead;
    const arDriveCommunityFee = contract.settings.find(
      (setting: (string | number)[]) =>
        setting[0].toString().toLowerCase() === "fee"
    );
    return arDriveCommunityFee ? arDriveCommunityFee[1] : 15;
  } catch {
    return 0.15; // Default fee of 15% if we cannot pull it from the community contract
  }
}
