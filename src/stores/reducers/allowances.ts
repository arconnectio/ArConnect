export interface Allowance {
  url: string;
  enabled: boolean;
  limit: number;
}

export interface IAllowancesAction {
  type: "TOGGLE_ALLOWANCE" | "SET_LIMIT" | "ADD_ALLOWANCE";
  payload: Partial<Allowance>;
}

export default function allowancesReducer(
  state: Allowance[] = [],
  action: IAllowancesAction
): Allowance[] {
  switch (action.type) {
    case "ADD_ALLOWANCE":
      if (
        !action.payload.enabled ||
        !action.payload.limit ||
        !action.payload.url
      )
        break;
      return [...state, action.payload as Allowance];

    case "SET_LIMIT":
      if (!action.payload.limit || !action.payload.url) break;
      return state.map((val) => ({
        ...val,
        limit:
          (action.payload.url === val.url ? action.payload.limit : val.limit) ??
          0.1
      }));

    case "TOGGLE_ALLOWANCE":
      if (action.payload.enabled === undefined || !action.payload.url) break;
      return state.map((val) => ({
        ...val,
        enabled:
          (action.payload.url === val.url
            ? action.payload.enabled
            : val.enabled) ?? true
      }));
  }

  return state;
}
