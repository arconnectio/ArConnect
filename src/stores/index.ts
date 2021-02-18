import { createStore } from "redux";
import reducers from "./reducers";
import { persistStore, persistReducer } from "redux-persist";
import { localStorage as localStorageBrowser } from "redux-persist-webextension-storage";

const persistConfig = {
  key: "root",
  storage: localStorageBrowser
};

const persistedReducer = persistReducer(persistConfig, reducers);

export default function getReduxInstance() {
  const store = createStore(persistedReducer),
    persistor = persistStore(store);

  return { store, persistor };
}
