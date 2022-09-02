import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["DISPATCH"];

const dispatch: ModuleProperties = {
  functionName: "dispatch",
  permissions
};

export interface DispatchResult {
  id: string;
  type?: "BASE" | "BUNDLED";
}

/** Maximum size (in bytes) sponsored for bundles using the Bundlr Network */
export const ACCEPTED_DISPATCH_SIZE = 120 * Math.pow(10, 3);

export default dispatch;
