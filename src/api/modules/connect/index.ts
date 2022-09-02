import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = [];

const connect: ModuleProperties = {
  functionName: "connect",
  permissions
};

export default connect;

export interface AppInfo {
  name?: string;
  logo?: string;
}
