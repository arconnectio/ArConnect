export interface Tab {
  id: string;
  totalTime: number;
  sessions: {
    [tabId: number]: {
      openedAt: Date;
      duration?: number;
      isActive: boolean;
    };
  };
}

export interface ITabAction {
  type: "START_SESSION" | "CLOSE_SESSION";
  payload: {
    id?: string;
    tabId: number;
  };
}

export default function timeTrackingReducer(
  state: Tab[] = [],
  action: ITabAction
): Tab[] {
  switch (action.type) {
    default:
      return state;
  }
}
