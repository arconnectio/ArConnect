import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ACCESS_PUBLIC_KEY"];

const publicKey: ModuleProperties = {
  functionName: "getActivePublicKey",
  permissions
};

export default publicKey;
