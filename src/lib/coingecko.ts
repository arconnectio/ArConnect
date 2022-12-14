/**
 * Compare two currencies
 *
 * @param symbol Symbol of the currency to get the price for
 * @param currency What to return the price in
 */
export async function getPrice(symbol: string, currency: string) {
  const data: CoinGeckoPriceResult = await (
    await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=${currency.toLowerCase()}`
    )
  ).json();

  return data[symbol.toLowerCase()][currency.toLowerCase()];
}

/**
 * Get price for the AR token using the coingecko API
 *
 * @param currency Currency to get the price in
 * @returns Price of 1 AR
 */
export async function getArPrice(currency: string) {
  return await getPrice("arweave", currency.toLowerCase());
}

interface CoinGeckoPriceResult {
  arweave: {
    [key: string]: number;
  };
  [key: string]: {
    [key: string]: number;
  };
}

export async function getMarketChart(currency: string, days = "max") {
  const data: CoinGeckoMarketChartResult = await (
    await fetch(
      `https://api.coingecko.com/api/v3/coins/arweave/market_chart?vs_currency=${currency}&days=${days}`
    )
  ).json();

  return data;
}

interface CoinGeckoMarketChartResult {
  /** Prices: arrany of date in milliseconds and price */
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export const currencies = [
  "USD",
  "EUR",
  "GBP",
  "CNY",
  "INR",
  "AED",
  "ARS",
  "AUD",
  "BDT",
  "BHD",
  "BMD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CZK",
  "DKK",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "JPY",
  "KRW",
  "KWD",
  "LKR",
  "MMK",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SAR",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TWD",
  "UAH",
  "VEF",
  "VND",
  "ZAR"
];
