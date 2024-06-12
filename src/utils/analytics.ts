import { getSetting } from "~settings";
import { ExtensionStorage, TempTransactionStorage } from "./storage";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { getWallets } from "~wallets";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { v4 as uuid } from "uuid";
import browser, { type Alarms } from "webextension-polyfill";
import axios from "axios";

const PUBLIC_SEGMENT_WRITEKEY = "J97E4cvSZqmpeEdiUQNC2IxS1Kw4Cwxm";

const analytics = AnalyticsBrowser.load({
  writeKey: PUBLIC_SEGMENT_WRITEKEY
});

export enum EventType {
  FUNDED = "FUNDED",
  CONNECTED_APP = "CONNECTED_APP",
  LOGIN = "LOGIN",
  ONBOARDED = "ONBOARDED",
  WAYFINDER_ACTIVATED = "WAYFINDER_ACTIVATED",
  WAYFINDER_GATEWAY_SELECTED = "WAYFINDER_GATEWAY_SELECTED",
  BALANCE = "BALANCE",
  SIGNED = "SIGNED",
  TRANSACTION_INCOMPLETE = "TRANSACTION_INCOMPLETE",
  FALLBACK = "FALLBACK",
  BUY_AR_DASHBOARD = "BUY_AR_DASHBOARD",
  BUY_AR_PURCHASE = "BUY_AR_PURCHASE",
  BUY_AR_CONFIRM_PURCHASE = "BUY_AR_CONFIRM_PURCHASE",
  CONTACTS = "CONTACTS",
  ADD_CONTACT = "ADD_CONTACT",
  REMOVE_CONTACT = "REMOVE_CONTACT",
  SEND_ALLOWANCE_CHANGE = "SEND_ALLOWANCE_CHANGE",
  TX_SENT = "TX_SENT",
  SUBSCRIBED = "SUBSCRIBED"
}

export enum PageType {
  HOME = "HOMEPAGE",
  EXPLORE = "EXPLORE",
  RECEIVE = "RECEIVE",
  SETTINGS = "SETTINGS",
  SEND = "SEND",
  CONFIRM_SEND = "CONFIRM_SEND",
  SEND_COMPLETE = "SEND_COMPLETE",
  ONBOARD_START = "ONBOARD_START",
  ONBOARD_PASSWORD = "ONBOARD_PASSWORD",
  ONBOARD_BACKUP = "ONBOARD_BACKUP",
  ONBOARD_SEEDPHRASE = "ONBOARD_SEEDPHRASE",
  ONBOARD_THEME = "ONBOARD_THEME",
  ONBOARD_COMPLETE = "ONBOARD_COMPLETE",
  SETUP_PIN = "SETUP_PIN",
  SETUP_EXPLORE = "SETUP_EXPLORE",
  SETUP_CONNECT = "SETUP_CONNECT",
  SUBSCRIPTIONS_MANAGEMENT = "SUBSCRIPTIONS_MANAGEMENT",
  TRANSAK_PURCHASE = "TRANSAK_PURCHASE",
  TRANSAK_CONFIRM_PURCHASE = "TRANSAK_CONFIRM_PURCHASE",
  TRANSAK_PURCHASE_PENDING = "TRANSAK_PURCHASE_PENDING",
  SUBSCRIPTIONS = "SUBSCRIPTIONS"
}

export const trackPage = async (title: PageType) => {
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  try {
    await analytics.page("ArConnect Extension", {
      title
    });
  } catch (err) {
    console.log("err", err);
  }
};

export const trackDirect = async (
  event: EventType,
  properties: Record<string, unknown>
) => {
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  let userId = await ExtensionStorage.get("user_id");
  if (!userId) {
    userId = uuid();
    await ExtensionStorage.set("user_id", userId);
  }

  return fetch("https://api.segment.io/v1/t", {
    method: "POST",
    body: JSON.stringify({
      event,
      properties,
      messageId: uuid(),
      sentAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      type: "track",
      userId: userId,
      writeKey: PUBLIC_SEGMENT_WRITEKEY
    })
  });
};

export const trackEvent = async (eventName: EventType, properties: any) => {
  // first we check if we are allowed to collect data
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  const ONE_HOUR_IN_MS = 3600000;

  // TODO:login is tracked only once and compared to an hour period before logged as another Login event
  if (eventName === EventType.LOGIN) {
    const storageTime = await TempTransactionStorage.get(EventType.LOGIN);

    if (storageTime && Date.now() < Number(storageTime) + ONE_HOUR_IN_MS) {
      return;
    }
  }

  const activeAddress = await ExtensionStorage.get<string>("active_address");

  if (eventName === EventType.FUNDED) {
    const hasBeenTracked = await ExtensionStorage.get<boolean>(
      `wallet_funded_${activeAddress}`
    );
    if (hasBeenTracked) {
      return;
    }
  }

  try {
    const time = Date.now();

    await analytics.track(eventName, { ...properties });

    // POST TRACK EVENTS
    // only log login once every hour
    if (eventName === EventType.LOGIN) {
      await TempTransactionStorage.set(eventName, time);
    }

    // only log funded once
    if (eventName === EventType.FUNDED) {
      await ExtensionStorage.set(`wallet_funded_${activeAddress}`, true);
    }
  } catch (err) {
    console.log(`Failed to track event ${eventName}:`, err);
  }
};

export const trackBalance = async (alarmInfo?: Alarms.Alarm) => {
  if (alarmInfo && !alarmInfo.name.startsWith("track-balance")) return;
  const wallets = await getWallets();
  const arweave = new Arweave(defaultGateway);
  let totalBalance = 0;

  await Promise.all(
    wallets.map(async ({ address }) => {
      try {
        const balance = arweave.ar.winstonToAr(
          await arweave.wallets.getBalance(address)
        );
        totalBalance += Number(balance);
      } catch (e) {
        console.log("invalid", e);
      }
    })
  );
  try {
    await trackDirect(EventType.BALANCE, { totalBalance });
    const timer = setToStartOfNextMonth(new Date());
    browser.alarms.create("track-balance", {
      when: timer.getTime()
    });
  } catch (err) {
    console.log("err tracking", err);
  }
};

/**
 * Initializes the AR balance event tracker.
 * This function sets up a monthly alarm to track the total balance.
 * It schedules the first alarm to the start of the next month and
 * stores this schedule time in the extension storage.
 */

export const initializeARBalanceMonitor = async () => {
  const timer = setToStartOfNextMonth(new Date());
  browser.alarms.create("track-balance", {
    when: timer.getTime()
  });
};

/**
 * Sets the given date to the start of the next month in UTC
 * The time is set to beginning of the month (00:00:00.000).
 * @param {Date} currentDate
 * @returns {Date} Date to trigger alarm
 */

const setToStartOfNextMonth = (currentDate: Date): Date => {
  const newDate = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0
    )
  );
  return newDate;
};

const GDPR_COUNTRIES_AND_OTHERS = [
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  "GB", // United Kingdom
  "CH", // Switzerland
  "BH", // Bahrain
  "IL", // Israel
  "QA", // Qatar
  "TR", // Turkey
  "KE", // Kenya
  "MU", // Mauritius
  "NG", // Nigeria
  "ZA", // South Africa
  "UG", // Uganda
  "JP", // Japan
  "KR", // South Korea
  "NZ", // New Zealand
  "AR", // Argentina
  "BR", // Brazil
  "UY", // Uruguay
  "CA" // Canada
];

// Defaults to true to
export const isUserInGDPRCountry = async (): Promise<boolean> => {
  try {
    const response = await axios.get("https://ipinfo.io?token=f73f7a8b88a8bf");

    const { country } = response.data;
    return GDPR_COUNTRIES_AND_OTHERS.includes(country);
  } catch (error) {
    console.error("Error fetching location:", error);
    return true;
  }
};
