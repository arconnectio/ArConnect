import { ACCEPTED_DISPATCH_SIZE, DispatchResult } from "./index";
import { createCoinWithAnimation } from "../sign/animation";
import type { TransformFinalizer } from "~api/foreground";
import type { ModuleFunction } from "~api/module";
import type Transaction from "arweave/web/lib/transaction";

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

export const finalizer: TransformFinalizer<{
  arConfetti: string;
  res: DispatchResult;
}> = (result) => {
  // show a nice confetti eeffect, if enabled
  if (result.arConfetti) {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createCoinWithAnimation(result.arConfetti), i * 150);
    }
  }

  return result.res;
};

export default foreground;
