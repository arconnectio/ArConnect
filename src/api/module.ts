import { PermissionType } from "../utils/permissions";

/**
 * Basic API module props interface
 */
export interface ModuleProperties {
  /** The name the function will be injected with into the API */
  functionName: string;
  /** Permissions required to execute this function */
  permissions: PermissionType[];
}

/** Full API module (background/foreground) */
export interface Module<T> extends ModuleProperties {
  function: ModuleFunction<T>;
}

/**
 * Function type for background and injected script API functions
 */
export type ModuleFunction<ResultType> = (
  ...params: any[]
) => Promise<ResultType> | ResultType;
