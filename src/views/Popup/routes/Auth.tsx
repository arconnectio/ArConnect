import React, { useState } from "react";
import { Button, Input, Spacer, useInput } from "@geist-ui/react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import styles from "../../../styles/views/Popup/auth.module.sass";
import Cryptr from "cryptr";

export default function Auth() {
  const passwordInput = useInput(""),
    [passwordStatus, setPasswordStatus] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
    wallets = useSelector((state: RootState) => state.wallets),
    [loading, setLoading] = useState(false),
    [loggedIn, setLoggedIn] = useState(false);

  async function login() {
    setLoading(true);
    // we need to wait a bit, because the decrypting
    // freezes the program, and the loading does not start
    setTimeout(() => {
      // try to login by decrypting
      try {
        const cryptr = new Cryptr(passwordInput.state);
        cryptr.decrypt(wallets[0].keyfile);
        setLoggedIn(true);
      } catch {
        setPasswordStatus("error");
      }
      setLoading(false);
    }, 70);
  }

  function accept() {
    if (!loggedIn) return;
    localStorage.removeItem("arweave_auth");
    chrome.runtime.sendMessage({
      type: "connect_result",
      ext: "weavemask",
      res: true,
      message: "Success",
      sender: "popup"
    });
    window.close();
  }

  function cancel() {
    chrome.runtime.sendMessage({
      type: "connect_result",
      ext: "weavemask",
      res: false,
      message: "User cancelled the login",
      sender: "popup"
    });
    localStorage.removeItem("arweave_auth");
    window.close();
  }

  return (
    <div className={styles.Auth}>
      {(!loggedIn && (
        <>
          <h1>Sign In</h1>
          <p>
            This site wants to connect to WeaveMask. Please enter your password
            to continue.
          </p>
          <Input
            {...passwordInput.bindings}
            status={passwordStatus}
            placeholder="Password..."
            type="password"
          />
          <Spacer />
          <Button
            style={{ width: "100%" }}
            onClick={login}
            loading={loading}
            type="success"
          >
            Log In
          </Button>
          <Spacer />
          <Button style={{ width: "100%" }} onClick={cancel}>
            Cancel
          </Button>
        </>
      )) || (
        <>
          <h1>Permissions</h1>
          <p>Please allow these permissions for this site</p>
          <ul>
            <li>Permission</li>
            <li>Another</li>
            <li>Etc...</li>
          </ul>
          <Spacer />
          <Button style={{ width: "100%" }} onClick={accept} type="success">
            Accept
          </Button>
          <Spacer />
          <Button style={{ width: "100%" }} onClick={cancel}>
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
