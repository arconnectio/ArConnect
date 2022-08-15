import { PermissionType } from "../utils/permissions";

/**
 * Basic API module interface
 * @param T The return type of the API function result
 */
export interface Module<ResultType> {
  functionName: string;
  permissions: PermissionType[];
  background: ModuleFunction<ResultType>;
  injected: ModuleFunction<ResultType>;
}

/**
 * Function type for background and injected script API functions
 */
export type ModuleFunction<ResultType> = () => Promise<ResultType> | ResultType;
