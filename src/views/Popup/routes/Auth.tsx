import React, { useEffect, useState } from "react";
import { Button, Input, Spacer, useInput } from "@geist-ui/react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { sendMessage } from "../../../utils/messenger";
import Cryptr from "cryptr";
import styles from "../../../styles/views/Popup/auth.module.sass";

export default function Auth() {
  const passwordInput = useInput(""),
    [passwordStatus, setPasswordStatus] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
    wallets = useSelector((state: RootState) => state.wallets),
    [loading, setLoading] = useState(false),
    [loggedIn, setLoggedIn] = useState(false),
    [permissions, setPermissions] = useState<PermissionType[]>([]);

  useEffect(() => {
    const authVal = localStorage.getItem("arweave_auth"),
      readPermissions: PermissionType[] | undefined =
        authVal && JSON.parse(authVal).permissions;

    // TODO: cache permissions
    if (readPermissions) setPermissions(readPermissions);
    else {
      sendMessage({
        type: "connect_result",
        ext: "weavemask",
        res: false,
        message: "No permissions requested",
        sender: "popup"
      });
      localStorage.removeItem("arweave_auth");
      window.close();
    }
  }, []);

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
    sendMessage({
      type: "connect_result",
      ext: "weavemask",
      res: true,
      message: "Success",
      sender: "popup"
    });
    window.close();
  }

  function cancel() {
    sendMessage({
      type: "connect_result",
      ext: "weavemask",
      res: false,
      message: "User cancelled the login",
      sender: "popup"
    });
    localStorage.removeItem("arweave_auth");
    window.close();
  }

  function getPermissionDescription(permission: PermissionType) {
    switch (permission) {
      case "ACCESS_ADDRESS":
        return "Access the current address in WeaveMask";

      case "ACCESS_ALL_ADDRESSES":
        return "Access all wallets' addresses in WeaveMask";

      case "CREATE_TRANSACTION":
        return "Create a new transaction";

      case "SIGN_TRANSACTION":
        return "Sign a transaction";
    }

    return "Invalid permission";
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
          {(permissions.length > 0 && (
            <ul>
              {permissions.map((permission) => (
                <li>{getPermissionDescription(permission)}</li>
              ))}
            </ul>
          )) || <p>No permissions requested.</p>}
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

// TODO: extract this to it's own library, import from there
type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_ALL_ADDRESSES"
  | "CREATE_TRANSACTION"
  | "SIGN_TRANSACTION";
