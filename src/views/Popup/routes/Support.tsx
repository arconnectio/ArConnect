import React, { Component } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Button, Toggle, Spacer, useToasts } from "@geist-ui/react";

import { updateSettings } from "../../../stores/actions";
import { RootState } from "../../../stores/reducers";

import {
  connectToNativeApp,
  isConnectedToNativeApp
} from "../../../utils/native_messaging";
import { sendNativeMessage } from "../../../utils/web_socket";

import styles from "../../../styles/views/Popup/support.module.sass";
import { browser } from "webextension-polyfill-ts";

export default function SupportWidget() {
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const [, setToast] = useToasts();

  return (
    <div className={styles.Support}>
      <p>
        By running{" "}
        <a
          href="#"
          onClick={() => {
            browser.tabs.create({ url: "https://arconnect.io" });
          }}
        >
          ArConnect desktop app
        </a>{" "}
        you’ll be contributing Arweave tokens to the sites you visit the most
        often.
      </p>
      <Button
        onClick={() => {
          if (!isConnectedToNativeApp()) {
            setToast({
              text: "Unable to connect to the desktop app",
              type: "error"
            });
            return;
          }

          sendNativeMessage("heartbeat", "");
        }}
      >
        {connectToNativeApp() ? "Stop" : "Start"}
      </Button>
      <div className={styles.Checkbox}>
        <label>Run desktop app on browser start</label>
        <Toggle
          checked={settings.enableSupport}
          onChange={() =>
            dispatch(updateSettings({ enableSupport: !settings.enableSupport }))
          }
        />
      </div>
    </div>
  );
}
