import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

// permissions required by this module
const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const exampleModule: ModuleProperties = {
  // name of the function (window.arweave.wallet.getExample)
  functionName: "getExample",
  permissions
};

export default exampleModule;
