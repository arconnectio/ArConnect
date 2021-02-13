import { createStore, compose, applyMiddleware } from "redux";
import reducers, { plainReducers } from "./reducers";
// @ts-ignore
import { middleware as asyncMiddleware } from "redux-async-initial-state";
import { local } from "chrome-storage-promises";

async function loadLocal() {
  try {
    const reducerNames = Object.keys(plainReducers),
      asyncStoreData: { [key: string]: any } =
        typeof chrome !== "undefined"
          ? await local.get(reducerNames.map((reducer) => `arweave_${reducer}`))
          : await browser.storage.local.get(
              reducerNames.map((reducer) => `arweave_${reducer}`)
            );
    let store: { [key: string]: any } = {};

    for (const reducer in asyncStoreData)
      store[reducer.replace("arweave_", "")] = asyncStoreData[reducer];

    return store;
  } catch {
    return {};
  }
}

async function saveLocal(state: { [key: string]: any }) {
  try {
    let storeWithArweaveKeys: { [key: string]: any } = {};
    for (const reducer in state)
      storeWithArweaveKeys[`arweave_${reducer}`] = state[reducer];

    console.log(state);

    console.log(storeWithArweaveKeys);

    if (typeof chrome !== "undefined") await local.set(storeWithArweaveKeys);
    else browser.storage.local.set(storeWithArweaveKeys);
  } catch {}
}

const store = createStore(
  reducers,
  compose(applyMiddleware(asyncMiddleware(loadLocal)))
);

store.subscribe(async () => await saveLocal(store.getState()));

export default store;
