import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const deleteSubscriptionModule: ModuleProperties = {
  functionName: "deleteSubscription",
  permissions
};

export default deleteSubscriptionModule;
