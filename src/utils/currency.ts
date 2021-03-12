import { Currency } from "../stores/reducers/settings";
import { exchangeRates } from "exchange-rates-api";
import limestone from "@limestonefi/api";

export function getSymbol(currency: Currency) {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "GBP") return "£";
  return "";
}

export async function arToFiat(quantity: number, currency: Currency) {
  const { price } = await limestone.getPrice("AR"),
    usdQuantity = price * quantity;

  if (currency === "USD") return usdQuantity;

  const exchangeRate = Number(
    await exchangeRates().latest().symbols(currency).base("USD").fetch()
  );
  return usdQuantity * exchangeRate;
}
