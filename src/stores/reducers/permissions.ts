import { PermissionType } from "../../utils/permissions";

export interface IPermissionState {
  url: string;
  permissions: PermissionType[];
}

export interface IPermissionsAction {
  type: "SET_PERMISSIONS" | "REMOVE_PERMISSIONS" | "USER_SIGNOUT";
  payload: IPermissionState;
}

export default function permissionsReducer(
  state: IPermissionState[] = [],
  action: IPermissionsAction
): IPermissionState[] {
  switch (action.type) {
    case "SET_PERMISSIONS":
      return [
        ...state.filter(({ url }) => url !== action.payload.url),
        action.payload
      ];

    case "REMOVE_PERMISSIONS":
      const item = state.find(({ url }) => url === action.payload.url);
      if (!item) break;
      return [
        ...state.filter(({ url }) => url !== action.payload.url),
        {
          ...item,
          permissions: item.permissions.filter(
            (permission) => !action.payload.permissions.includes(permission)
          )
        }
      ];

    case "USER_SIGNOUT":
      return [];
  }

  return state;
}
