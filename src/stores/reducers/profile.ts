export interface IProfileAction {
  type: "SWITCH_PROFILE" | "USER_SIGNOUT";
  payload: {
    address?: string;
  };
}

export default function profileReducer(
  state: string = "",
  action: IProfileAction
): string {
  switch (action.type) {
    case "SWITCH_PROFILE":
      return action.payload.address ?? "";

    case "USER_SIGNOUT":
      return "";
  }

  return state;
}
