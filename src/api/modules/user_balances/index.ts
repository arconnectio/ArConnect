import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_BALANCES"];

const userBalancesModule: ModuleProperties = {
  functionName: "userBalances",
  permissions
};

export default userBalancesModule;
