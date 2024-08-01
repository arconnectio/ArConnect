import type { PermissionType } from "~applications/permissions";
import type { ModuleProperties } from "~api/module";

const permissions: PermissionType[] = ["ACCESS_BALANCES"];

const userTokensModule: ModuleProperties = {
  functionName: "userTokens",
  permissions
};

export default userTokensModule;
