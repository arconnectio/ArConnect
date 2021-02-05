import { combineReducers } from "redux";

import wallets from "./reducers/wallets";
import profile from "./reducers/profile";
import assets from "./reducers/assets";
import permissions from "./reducers/permissions";

export const plainReducers = {
  wallets,
  profile,
  assets,
  permissions
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
