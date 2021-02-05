import React, { useEffect, useState } from "react";
import { Button, Input, Spacer, useInput } from "@geist-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../stores/reducers";
import { sendMessage } from "../../utils/messenger";
import { setPermissions } from "../../stores/actions";
import Cryptr from "cryptr";
import styles from "../../styles/views/Auth/view.module.sass";

export default function App() {
  const passwordInput = useInput(""),
    [passwordStatus, setPasswordStatus] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
    wallets = useSelector((state: RootState) => state.wallets),
    [loading, setLoading] = useState(false),
    [loggedIn, setLoggedIn] = useState(false),
    permissions = useSelector((state: RootState) => state.permissions),
    [requestedPermissions, setRequestedPermissions] = useState<
      PermissionType[]
    >([]),
    [currentURL, setCurrentURL] = useState<string>(),
    [type, setType] = useState<
      "connect" | "create_transaction" | "sign_transaction"
    >(),
    dispatch = useDispatch();

  useEffect(() => {
    const authVal = new URL(window.location.href).searchParams.get("auth");
    if (!authVal) {
      sendMessage({
        type: "connect_result",
        ext: "weavemask",
        res: false,
        message: "Invalid auth call",
        sender: "popup"
      });
      window.close();
      return;
    }

    const decodedAuthParam: {
      val: boolean;
      permissions?: PermissionType[];
      type?: "connect" | "create_transaction" | "sign_transaction";
      url?: string;
    } = JSON.parse(decodeURIComponent(authVal));

    if (
      decodedAuthParam.type &&
      decodedAuthParam.permissions &&
      decodedAuthParam.url
    ) {
      setType(decodedAuthParam.type);
      setRequestedPermissions(decodedAuthParam.permissions);
      setCurrentURL(getRealURL(decodedAuthParam.url));
    } else {
      sendMessage({
        type: "connect_result",
        ext: "weavemask",
        res: false,
        message: "Invalid auth call",
        sender: "popup"
      });
      window.close();
    }

    window.addEventListener("beforeunload", cancel);

    return function cleanup() {
      window.removeEventListener("beforeunload", cancel);
    };
  }, []);

  function getRealURL(url: string) {
    const arweaveTxRegex = /(http|https)(:\/\/)(.*)(\.arweave\.net\/)/g,
      match = url.match(arweaveTxRegex);
    if (match)
      return (
        match[0].replace(/(http|https)(:\/\/)/, "") +
        url.replace(arweaveTxRegex, "").split("/")[0]
      );
    else return url.replace(/(http|https)(:\/\/)/, "").split("/")[0];
  }

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

  function urlError() {
    sendMessage({
      type: "connect_result",
      ext: "weavemask",
      res: false,
      message: "No tab selected",
      sender: "popup"
    });
    window.close();
  }

  function accept() {
    if (!loggedIn) return;
    if (!currentURL) return urlError();
    dispatch(setPermissions(currentURL, requestedPermissions));
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
          {(requestedPermissions.length > 0 && (
            <ul>
              {requestedPermissions.map((permission, i) => (
                <li key={i}>{getPermissionDescription(permission)}</li>
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
