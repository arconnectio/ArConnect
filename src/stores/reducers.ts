import { combineReducers } from "redux";

import wallets from "./reducers/wallets";
import profile from "./reducers/profile";
import assets from "./reducers/assets";

export const plainReducers = {
  wallets,
  profile,
  assets
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
