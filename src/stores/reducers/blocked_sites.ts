export interface IBlockedAction {
  type: "ADD_SITE" | "REMOVE_SITE";
  payload: string;
}

export default function blockedSitesReducer(
  state: string[] = [],
  action: IBlockedAction
): string[] {
  switch (action.type) {
    case "ADD_SITE":
      return [...state, action.payload];

    case "REMOVE_SITE":
      return state.filter((url) => url !== action.payload);
  }

  return state;
}
