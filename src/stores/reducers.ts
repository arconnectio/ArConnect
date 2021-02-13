import { combineReducers } from "redux";
// @ts-ignore
import { outerReducer, innerReducer } from "redux-async-initial-state";

import wallets from "./reducers/wallets";
import profile from "./reducers/profile";
import assets from "./reducers/assets";
import permissions from "./reducers/permissions";
import blockedSites from "./reducers/blocked_sites";
import arweave from "./reducers/arweave";

export const plainReducers = {
  wallets,
  profile,
  assets,
  permissions,
  blockedSites,
  arweave
};
const reducers = outerReducer(
  combineReducers({
    ...plainReducers,
    asyncInitialState: innerReducer
  })
);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
