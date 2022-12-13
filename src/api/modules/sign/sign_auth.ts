import type { Tag } from "arweave/web/lib/transaction";
import type Transaction from "arweave/web/lib/transaction";
import authenticate from "../connect/auth";

/**
 * Request a manual signature for the transaction.
 * The user has to authenticate and sign the
 * transaction.
 *
 * @param tabURL App url
 * @param transaction Transaction to sign
 * @param address Address of the wallet that signs the tx
 */
export async function signAuth(
  tabURL: string,
  transaction: Transaction,
  address: string
) {
  await authenticate({
    type: "sign",
    url: tabURL,
    address,
    transaction: {
      quantity: transaction.quantity,
      reward: transaction.reward,
      // @ts-expect-error
      tags: transaction.get("tags").map((tag: Tag) => ({
        name: tag.get("name", { decode: true, string: true }),
        value: tag.get("value", { decode: true, string: true })
      })),
      size: transaction.data_size
    }
  });
}
