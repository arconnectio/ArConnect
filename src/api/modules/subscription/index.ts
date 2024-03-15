import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const subsciption: ModuleProperties = {
  functionName: "subscription",
  permissions
};

export default subsciption;
