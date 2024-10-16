import enDic from "url:/assets/_locales/en/messages.json";
import zhCnDic from "url:/assets/_locales/zh_CN/messages.json";

const alarms = {
  create: null,
  clear: null,
  getAll: null,
  onAlarm: {
    addEventListener: null
  }
};

const dictionaries = {
  en: enDic as unknown as Record<
    string,
    { message: string; description: string }
  >,
  "zh-CN": zhCnDic as unknown as Record<
    string,
    { message: string; description: string }
  >
} as const;

const i18n = {
  getMessage: (key: string) => {
    const dictionaryLanguage =
      navigator.languages.find((language) => {
        return dictionaries.hasOwnProperty(language);
      }) || "en";

    const dictionary = dictionaries[dictionaryLanguage];
    const value = dictionary[key]?.message;

    if (!value) {
      console.warn(`Missing ${dictionaryLanguage} translation for ${key}.`);
    }

    // TODO: Default to English instead?
    return value || `<${key}>`;
  }
};

// The 2 polyfill below should address lines like this:
// browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

const runtime = {
  getURL: (path: string) => {
    console.trace("getURL()");

    return new URL(path, document.location.origin).toString();
  },
  getManifest: () => {
    return {
      browser_action: {
        default_popup: "popup.html"
      }
    };
  }
};

const tabs = {
  create: async ({ url }) => {
    console.log(`Go to ${url}`);

    // URL =
    // browser.runtime.getURL("tabs/welcome.html")
    // browser.runtime.getURL("tabs/dashboard.html#/contacts")
    // browser.runtime.getURL("assets/animation/arweave.png");
    // browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(...)}

    if (url === "tabs/welcome.html") {
      location.hash = "/welcome";
    } else if (url.startsWith("tabs/dashboard.html#")) {
      const hash = url.split("#").pop();

      location.hash = hash;
    } else if (url.startsWith("tabs/auth.html")) {
      throw new Error(`Cannot create tab for URL = ${url}`);
    } else if (url.startsWith("assets")) {
      throw new Error(`Cannot create tab for URL = ${url}`);
    } else {
      throw new Error(`Cannot create tab for URL = ${url}`);
    }
  },
  query: async () => {
    const parentURL =
      window.location === window.parent.location
        ? document.location.href
        : document.referrer;

    return { url: parentURL }; // satisfies browser.Tabs.Tab
  },
  onConnect: {
    addListener: () => {},
    removeListener: () => {}
  },
  onUpdated: {
    addListener: () => {},
    removeListener: () => {}
  }
};

export default {
  // alarms,
  i18n,
  runtime,
  tabs
};
