/**
 * GET currency $AR price quote
 *
 * @param currency Symbol of the currency to get the quote for
 * @param paymentMethod How the user plans to pay for AR
 * @param amount How much fiat currency to buy AR with
 */
export async function getQuote(
  currency: string,
  paymentMethod: string,
  amount: number
) {
  try {
    const apiKey = process.env.PLASMO_PUBLIC_ONRAMPER_API_KEY;

    if (!apiKey) {
      throw new Error("API key is undefined");
    }

    const response = await fetch(
      `https://api.onramper.com/quotes/${currency}/ar_arweave?paymentMethod=${paymentMethod}&amount=${amount}`,
      {
        headers: {
          Authorization: apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching quote: ", error);
    throw error;
  }
}
