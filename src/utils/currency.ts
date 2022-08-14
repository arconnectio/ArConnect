import { Currency } from "../stores/reducers/settings";
import { exchangeRates } from "exchange-rates-api";
import redstone from "redstone-api";
import axios from "axios";

/**
 * Get symbol for currency
 *
 * @param currency Currency to get the symbol of
 *
 * @returns Symbol string
 */
export function getSymbol(currency: Currency) {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "";
}
/**
 * Convert arweave to fiat currency
 *
 * @param quantity Quantity to convert
 * @param currency Currency to use for conversion
 *
 * @returns Amount in the provided currency
 */
export async function arToFiat(quantity: number, currency: Currency) {
  let price;

  try {
    const { value } = await redstone.getPrice("AR");

    price = value;
  } catch {
    const { data: res }: any = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
    );
    price = res.arweave.usd;
  }

  const usdQuantity = price * quantity;

  if (currency === "USD") return usdQuantity;

  const exchangeRate = Number(
    await exchangeRates().latest().symbols(currency).base("USD").fetch()
  );
  return usdQuantity * exchangeRate;
}
