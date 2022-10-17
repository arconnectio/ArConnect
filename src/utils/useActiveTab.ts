import browser, { Tabs } from "webextension-polyfill";
import { getActiveTab } from "~applications";
import { useEffect, useState } from "react";

export default function useActiveTab() {
  const [activeTab, setActiveTab] = useState<Tabs.Tab>();

  useEffect(() => {
    (async () => {
      // listener for active tab
      const fetchActiveTab = async () => {
        const tab = await getActiveTab();

        setActiveTab(tab);
      };

      // load current tab
      await fetchActiveTab();

      // listen for changes
      browser.tabs.onUpdated.addListener(fetchActiveTab);

      return () => browser.tabs.onUpdated.removeListener(fetchActiveTab);
    })();
  }, []);

  return activeTab;
}
