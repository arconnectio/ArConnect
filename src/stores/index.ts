import { createStore } from "redux";
import reducers, { plainReducers } from "./reducers";

function saveLocal(state: any) {
  try {
    for (const st in state) {
      localStorage.setItem(`arweave_${st}`, JSON.stringify({ val: state[st] }));
    }
  } catch {}
}

function loadLocal() {
  let serialisedState: Record<string, any> = {};

  try {
    for (const reducer in plainReducers) {
      const serialisedReducer = localStorage.getItem(`arweave_${reducer}`);

      if (serialisedReducer !== null)
        serialisedState[reducer] = JSON.parse(serialisedReducer).val;
    }
  } catch {}
  return serialisedState;
}

const store = createStore(reducers, loadLocal());

store.subscribe(() => saveLocal(store.getState()));

export default store;
