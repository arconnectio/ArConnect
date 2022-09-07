import Setting from "./setting";

/** All settings */
const settings: Setting[] = [
  new Setting({
    name: "fee_multiplier",
    displayName: "Fee multiplier",
    description: "Control the fees payed after transactions",
    type: "number"
  }),
  new Setting({
    name: "currency",
    displayName: "Currency",
    description: "Fiat display currency",
    type: "pick",
    options: ["usd", "eur", "gbp"]
  }),
  new Setting({
    name: "arverify",
    displayName: "ArVerify treshold",
    description: "Set the verification threshold used",
    type: "number"
  }),
  new Setting({
    name: "arconfetti",
    displayName: "ArConfetti effect",
    description: "Show animation on wallet usage",
    type: "pick",
    options: [false, "arweave", "hedgehog", "usd"],
  })
];

/**
 * Get a setting instance
 */
export function getSetting(name: string) {
  return settings.find(
    (setting) => setting.name === name
  );
}

export const PREFIX = "setting_";

export default settings;