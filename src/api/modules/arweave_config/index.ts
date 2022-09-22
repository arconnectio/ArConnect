import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ACCESS_ARWEAVE_CONFIG"];

const arweaveConfig: ModuleProperties = {
  functionName: "getArweaveConfig",
  permissions
};

export default arweaveConfig;
