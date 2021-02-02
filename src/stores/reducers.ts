import { combineReducers } from "redux";

import wallets from "./reducers/wallets";
import profile from "./reducers/profile";

export const plainReducers = {
  wallets,
  profile
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
