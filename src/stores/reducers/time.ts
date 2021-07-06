export interface Tab {
  id: string;
  sessions: {
    [tabId: number]: {
      openedAt: Date;
      duration?: number;
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

export default function timeReducer(
  state: Tab[] = [],
  action: ITabAction
): Tab[] {
  switch (action.type) {
    case "START_SESSION":
      if (!action.payload.id) break;

      const index = state.findIndex((tab) => tab.id === action.payload.id);
      if (index === -1) {
        // No data stored for ID.
        return [
          ...state,
          {
            id: action.payload.id,
            sessions: {
              [action.payload.tabId]: {
                openedAt: new Date()
              }
            }
          }
        ];
      } else {
        // Already stored.
        const sessions = state[index].sessions;
        state[index] = {
          id: action.payload.id,
          sessions: {
            ...sessions,
            [action.payload.tabId]: {
              openedAt: new Date()
            }
          }
        };

        return state;
      }

    case "CLOSE_SESSION":
      for (let i = 0; i < state.length; i++) {
        const entry = state[i];

        for (const [id, session] of Object.entries(entry.sessions)) {
          if (+id === action.payload.tabId && !session.duration) {
            state[i].sessions[+id].duration =
              Math.floor(new Date().getTime() / 1000) -
              Math.floor(new Date(session.openedAt).getTime() / 1000);
          }
        }
      }

      return state;
  }

  return state;
}
