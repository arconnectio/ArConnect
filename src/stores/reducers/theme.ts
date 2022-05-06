import { DisplayTheme } from "@verto/ui/dist/types";

/**
 * User theme is the actual theme variable set by the user.
 * Unlike "DisplayTheme", it does not reflect what the current
 * theme of the app looks like, rather the user's choice if the
 * theme should have a fixed value of "Light" or "Dark", or if
 * ArConnect should use the browser's color scheme to determinate it.
 */
export type UserTheme = DisplayTheme | "Auto";

export interface IThemeAction {
  type: "SET_USER_THEME";
  payload: UserTheme;
}

export default function themeReducer(
  state: UserTheme = "Auto",
  action: IThemeAction
): UserTheme {
  if (action.type !== "SET_USER_THEME") return state;
  return action.payload;
}
