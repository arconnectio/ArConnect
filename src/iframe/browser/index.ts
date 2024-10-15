import enDic from "url:/assets/_locales/en/messages.json";
import zhCnDic from "url:/assets/_locales/zh_CN/messages.json";

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

/*
browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });
*/

const runtime = {
  getURL: (path: string) => {
    return `/${path}`;
  }
};

const tabs = {
  create: async ({ url }) => {
    location.href = url;
  }

  // query
};

export default {
  i18n,
  tabs,
  runtime
};
