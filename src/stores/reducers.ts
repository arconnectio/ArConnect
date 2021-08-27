import { combineReducers } from "redux";

import wallets from "./reducers/wallets";
import profile from "./reducers/profile";
import assets from "./reducers/assets";
import permissions from "./reducers/permissions";
import blockedSites from "./reducers/blocked_sites";
import arweave from "./reducers/arweave";
import allowances from "./reducers/allowances";
import settings from "./reducers/settings";
import balances from "./reducers/balances";
import timeTracking from "./reducers/time_tracking";

export const plainReducers = {
  wallets,
  profile,
  assets,
  permissions,
  blockedSites,
  arweave,
  allowances,
  settings,
  balances,
  timeTracking
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
