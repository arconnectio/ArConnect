import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ACCESS_ALL_ADDRESSES"];

const walletNames: ModuleProperties = {
  functionName: "getWalletNames",
  permissions
};

export default walletNames;
