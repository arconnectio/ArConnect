import { PermissionType } from "../utils/permissions";

/**
 * Basic API module interface
 * @param T The return type of the API function result
 */
export interface Module<ResultType> {
  /** The name the function will be injected with into the API */
  functionName: string;
  /** Permissions required to execute this function */
  permissions: PermissionType[];
  /** The background script function of this module (back-end) */
  background: ModuleFunction<ResultType>;
  /** The injected script function of this module (front-end) */
  injected: ModuleFunction<ResultType>;
}

/**
 * Function type for background and injected script API functions
 */
export type ModuleFunction<ResultType> = (
  ...params: any[]
) => Promise<ResultType> | ResultType;
