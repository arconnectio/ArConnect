import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const getSubscriptionModule: ModuleProperties = {
  functionName: "getSubscription",
  permissions
};

export default getSubscriptionModule;
