import { combineReducers } from "redux";

import wallets from "./reducers/wallets";

export const plainReducers = {
  wallets
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
