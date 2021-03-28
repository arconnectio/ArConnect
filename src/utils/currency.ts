import { Currency } from "../stores/reducers/settings";
import { exchangeRates } from "exchange-rates-api";
import limestone from "@limestonefi/api";
import axios from "axios";

export function getSymbol(currency: Currency) {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "";
}

export async function arToFiat(quantity: number, currency: Currency) {
  let price;
  try {
    const res = await limestone.getPrice("AR");
    price = res.price;
  } catch {
    const { data: res } = await axios.get(
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
