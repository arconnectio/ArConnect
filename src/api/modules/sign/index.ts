import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";
import { SplitTransaction } from "./transaction_builder";

const permissions: PermissionType[] = ["SIGN_TRANSACTION"];

const sign: ModuleProperties = {
  functionName: "sign",
  permissions
};

export default sign;

export interface BackgroundResult {
  transaction: SplitTransaction;
  arConfetti: boolean;
}
