import { Threshold } from "arverify";

export type Currency = "USD" | "EUR" | "GBP";
export interface ISettings {
  currency: Currency;
  arConfetti: boolean;
  arVerifyTreshold: Threshold;
  feeMultiplier: number;
  bundles: boolean;
}

export interface ISettingsAction {
  type: "UPDATE_SETTINGS" | "USER_SIGNOUT";
  payload: Partial<ISettings>;
}

const defaultConfig: ISettings = {
  currency: "USD",
  arConfetti: true,
  arVerifyTreshold: Threshold.MEDIUM,
  feeMultiplier: 1,
  bundles: false
};

export default function settingsReducer(
  state: ISettings = defaultConfig,
  action: ISettingsAction
): ISettings {
  switch (action.type) {
    case "UPDATE_SETTINGS":
      return { ...state, ...action.payload };

    case "USER_SIGNOUT":
      return defaultConfig;
  }

  return state;
}
