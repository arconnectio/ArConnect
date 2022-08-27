import { ModuleFunction } from "../../module";
import { ACCEPTED_DISPATCH_SIZE } from "./index";
import Transaction from "arweave/web/lib/transaction";

const foreground: ModuleFunction<Record<any, any>> = (
  transaction: Transaction
) => {
  // check tx data size
  // we don't allow size > ACCEPTED_DISPATCH_SIZE
  const dataSize = transaction.data.length;

  if (dataSize > ACCEPTED_DISPATCH_SIZE) {
    throw new Error(
      `ArConnect does not currently support dispatching transactions with data greater than ${ACCEPTED_DISPATCH_SIZE} bytes.`
    );
  }

  return [transaction.toJSON()];
};

export default foreground;
