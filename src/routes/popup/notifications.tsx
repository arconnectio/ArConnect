import { fetchNotifications } from "~utils/notifications";
import { ListItem } from "@arconnect/components";
import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import styled from "styled-components";

export default function Notifications() {
  const [notifications, setNotifications] = useState("");

  useEffect(() => {
    (async () => {
      const n = await fetchNotifications();
      setNotifications(n);
    })();
  }, [fetchNotifications]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_notifications")} />
      {notifications}
    </>
  );
}
