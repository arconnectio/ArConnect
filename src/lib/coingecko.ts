import axios from "axios";

/**
 * Get price for the AR token using the coingecko API
 *
 * @param currency Currency to get the price in
 * @returns Price of 1 AR
 */
export async function getArPrice(currency: string) {
  const { data } = await axios.get<CoinGeckoResult>(
    `https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=${currency.toLowerCase()}`
  );

  return data.arweave[currency.toLowerCase()];
}

interface CoinGeckoResult {
  arweave: {
    [key: string]: number;
  };
}
