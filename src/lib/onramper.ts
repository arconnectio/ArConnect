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

    const payout = data.length > 0 ? data[0].payout : undefined;
    if (payout === undefined) {
      throw new Error("Invalid fiat amount");
    }

    return data;
  } catch (error) {
    console.error("Error fetching quote: ", error);
    throw error;
  }
}

/**
 * POST Buy AR transaction for checkout
 *
 * @param onramp onramp being used
 * @param source fiat currency chosen
 * @param destination <-- ar_arweave
 * @param amount amount of fiat buying AR with
 * @param type <-- buy
 * @param paymentMethod chosen payment method
 * @param wallet.address user's active wallet address
 * @param network <-- arweave
 */

export async function buyRequest(
  onramp: string,
  source: string,
  amount: number,
  paymentMethod: string,
  wallet: { address: string }
) {
  try {
    const apiKey = process.env.PLASMO_PUBLIC_ONRAMPER_API_KEY;

    if (!apiKey) {
      throw new Error("API key is undefined");
    }

    const url = "https://api.onramper.com/checkout/intent";

    const requestBody = {
      onramp,
      source,
      destination: "ar_arweave",
      amount,
      type: "buy",
      paymentMethod,
      wallet: {
        address: wallet.address
      },
      network: "arweave"
    };

    console.log(requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending POST request: ", error);
    throw error;
  }
}
