import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Spacer,
  useInput,
  Loading,
  Checkbox,
  Modal,
  useModal,
  Note
} from "@geist-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../stores/reducers";
import { sendMessage, MessageType } from "../../utils/messenger";
import {
  addAllowance,
  setAllowanceLimit,
  setPermissions,
  toggleAllowance
} from "../../stores/actions";
import { getRealURL } from "../../utils/url";
import { local } from "chrome-storage-promises";
import { ChevronRightIcon } from "@primer/octicons-react";
import { Allowance } from "../../stores/reducers/allowances";
import {
  PermissionType,
  PermissionDescriptions
} from "../../utils/permissions";
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
    [type, setType] = useState<AuthType>(),
    dispatch = useDispatch(),
    [alreadyHasPermissions, setAlreadyHasPermissions] = useState(false),
    profile = useSelector((state: RootState) => state.profile),
    allowanceModal = useModal(false),
    allowanceAmount = useInput("0"),
    allowances = useSelector((state: RootState) => state.allowances),
    [currentAllowance, setCurrentAllowance] = useState<Allowance>(),
    [spendingLimitReached, setSpendingLimitReached] = useState<boolean>();

  useEffect(() => {
    // get the auth param from the url
    const authVal = new URL(window.location.href).searchParams.get("auth");

    // invalid auth
    if (!authVal) {
      sendMessage({
        type: getReturnType(),
        ext: "arconnect",
        res: false,
        message: "Invalid auth call",
        sender: "popup"
      });
      window.close();
      return;
    }

    // decode the auth param from the authVal
    const decodedAuthParam: {
      permissions?: PermissionType[];
      type?: AuthType;
      url?: string;
      spendingLimitReached?: boolean;
    } = JSON.parse(decodeURIComponent(authVal));

    // if the type does not exist, this is an invalid call
    if (!decodedAuthParam.type) {
      sendMessage({
        type: getReturnType(),
        ext: "arconnect",
        res: false,
        message: "Invalid auth call",
        sender: "popup"
      });
      window.close();
      return;
    } else setType(decodedAuthParam.type);

    // get the current tab url from the decoded auth val
    let url = decodedAuthParam.url;
    if (!url) return urlError();
    setCurrentURL(getRealURL(url));
    url = getRealURL(url);

    // connect event
    if (decodedAuthParam.type === "connect" && decodedAuthParam.permissions) {
      // get the existing permissions
      const existingPermissions = permissions.find(
        (permGroup) => permGroup.url === url
      );

      // set the requested permissions to all requested
      setRequestedPermissions(decodedAuthParam.permissions);

      // filter the requested permissions: only display/ask for permissions
      // that the url does not have yet
      if (existingPermissions && existingPermissions.permissions.length > 0) {
        setAlreadyHasPermissions(true);
        setRequestedPermissions(
          decodedAuthParam.permissions.filter(
            (perm) => !existingPermissions.permissions.includes(perm)
          )
        );
      }

      // create transaction event
    } else if (decodedAuthParam.type === "sign_auth") {
      // check permissions
      if (!checkPermissions(["SIGN_TRANSACTION"], url))
        return sendPermissionError();

      // encrypt data event
    } else if (decodedAuthParam.type === "encrypt_auth") {
      // check permissions
      if (!checkPermissions(["ENCRYPT"], url)) return sendPermissionError();

      // if non of the types matched, this is an invalid auth call
    } else {
      sendMessage({
        type: getReturnType(),
        ext: "arconnect",
        res: false,
        message: "Invalid auth call",
        sender: "popup"
      });
      window.close();
      return;
    }

    loadAllowance(url);
    setSpendingLimitReached(decodedAuthParam.spendingLimitReached);

    // send cancel event if the popup is closed by the user
    window.addEventListener("beforeunload", cancel);

    return function cleanup() {
      window.removeEventListener("beforeunload", cancel);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!currentAllowance) return;
    else loadAllowance(currentAllowance.url);
    // eslint-disable-next-line
  }, [currentAllowance]);

  // decrypt current wallet
  async function login() {
    setLoading(true);
    // we need to wait a bit, because the decrypting
    // freezes the program, and the loading does not start
    setTimeout(() => {
      // try to login by decrypting
      try {
        const cryptr = new Cryptr(passwordInput.state),
          keyfileToDecrypt = wallets.find(({ address }) => address === profile)
            ?.keyfile;

        if (!keyfileToDecrypt) {
          setPasswordStatus("error");
          setLoading(false);
          return;
        }
        cryptr.decrypt(keyfileToDecrypt);
        if (typeof chrome !== "undefined")
          local.set({ decryptionKey: passwordInput.state });
        else browser.storage.local.set({ decryptionKey: passwordInput.state });
        setLoggedIn(true);

        // any event that needs authentication, but not the connect event
        if (type !== "connect") {
          if (!currentURL) return urlError();
          else {
            sendMessage({
              type: getReturnType(),
              ext: "arconnect",
              res: true,
              message: "Success",
              sender: "popup",
              decryptionKey: passwordInput.state
            });
            window.close();
          }

          // connect event
        } else {
          setLoggedIn(true);
          setLoading(false);
        }
      } catch {
        setPasswordStatus("error");
        setLoading(false);
      }
    }, 70);
  }

  // invalid url sent
  function urlError() {
    sendMessage({
      type: getReturnType(),
      ext: "arconnect",
      res: false,
      message: "No tab selected",
      sender: "popup"
    });
    window.close();
  }

  // get the type that needs to be returned in the message
  function getReturnType(): MessageType {
    if (type === "connect") return "connect_result";
    else if (type === "sign_auth") return "sign_auth_result";
    else if (type === "encrypt_auth") return "encrypt_auth_result";
    //
    return "connect_result";
  }

  // accept permissions
  function accept() {
    if (!loggedIn) return;
    if (!currentURL) return urlError();

    const currentPerms: PermissionType[] =
      permissions.find(({ url }) => url === currentURL)?.permissions ?? [];
    dispatch(
      setPermissions(currentURL, [...currentPerms, ...requestedPermissions])
    );
    // give time for the state to update
    setTimeout(() => {
      sendMessage({
        type: getReturnType(),
        ext: "arconnect",
        res: true,
        message: "Success",
        sender: "popup"
      });
      window.close();
    }, 500);
  }

  // cancel login or permission request
  function cancel() {
    sendMessage({
      type: getReturnType(),
      ext: "arconnect",
      res: false,
      message: "User cancelled the login",
      sender: "popup"
    });
    window.close();
  }

  // return the description of a permission
  function getPermissionDescription(permission: PermissionType) {
    return PermissionDescriptions[permission];
  }

  // problem with permissions
  function sendPermissionError() {
    sendMessage({
      type: getReturnType(),
      ext: "arconnect",
      res: false,
      message:
        "The site does not have the required permissions for this action",
      sender: "popup"
    });
  }

  function checkPermissions(permissionsToCheck: PermissionType[], url: string) {
    const perms =
      permissions.find((permItem) => permItem.url === url)?.permissions ?? [];

    for (const pm of permissionsToCheck) if (!perms.includes(pm)) return false;

    return true;
  }

  function loadAllowance(currUrl: string) {
    const curr = allowances.find(({ url }) => url === currUrl);
    if (!curr) {
      dispatch(addAllowance(currUrl, true, 0.1));
      setCurrentAllowance({ url: currUrl, enabled: true, limit: 0.1 });
      allowanceAmount.setState("0.1");
    } else {
      setCurrentAllowance(curr);
      allowanceAmount.setState(curr.limit.toString());
    }
  }

  return (
    <>
      <div className={styles.Auth}>
        {spendingLimitReached && (
          <Note
            type="warning"
            style={{
              position: "fixed",
              top: "2em",
              left: ".7em",
              right: ".7em"
            }}
          >
            You have reached your spending limit of {currentAllowance?.limit}{" "}
            for this site. Please update it or cancel.
          </Note>
        )}
        {(!loggedIn && (
          <>
            <h1>Sign In</h1>
            {(type === "connect" && (
              <p>
                This site wants to connect to your Arweave wallet. Please enter
                your password to continue.
              </p>
            )) ||
              (type === "sign_auth" && (
                <p>
                  This site wants to sign a transaction. Please enter your
                  password to continue.
                </p>
              )) ||
              (type === "encrypt_auth" && (
                <p>
                  This site wants to encrypt some data. Please enter your
                  password to continue.
                </p>
              ))}
            <Input
              {...passwordInput.bindings}
              status={passwordStatus}
              placeholder="Password..."
              type="password"
              onKeyPress={(e) => {
                if (e.key === "Enter") login();
              }}
            />
            <Spacer />
            <div className={styles.Allowance}>
              <div className={styles.Check + " " + styles.Checked}>
                <Checkbox
                  checked={currentAllowance?.enabled}
                  size="medium"
                  onChange={(e) => {
                    if (!currentURL) return e.preventDefault();
                    dispatch(toggleAllowance(currentURL, e.target.checked));
                  }}
                />
              </div>
              <div
                className={styles.AllowanceAction}
                onClick={() => allowanceModal.setVisible(true)}
              >
                <p>Use allowance limit</p>
                <ChevronRightIcon />
              </div>
            </div>
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
            <h2 className={styles.th8ta}>
              th<span>8</span>ta
            </h2>
          </>
        )) ||
          (type === "connect" && (
            <>
              <h1>Permissions</h1>
              {(alreadyHasPermissions && (
                <p>This site wants to access more permissions:</p>
              )) || <p>Please allow these permissions for this site</p>}
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
          )) || (
            <p
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                width: "75%"
              }}
            >
              <Loading style={{ display: "block", margin: "0 auto" }} />
              {type === "sign_auth" && "Signing a transaction."}
              {type === "encrypt_auth" && "Encrypting some data."}
            </p>
          )}
      </div>
      <Modal {...allowanceModal.bindings}>
        <Modal.Title>Allowance limit</Modal.Title>
        <Modal.Content>
          <p>
            Warn me again to set a new allowance once the app has sent more than{" "}
            {allowanceAmount.state} AR
          </p>
          <Input
            {...allowanceAmount.bindings}
            type="number"
            placeholder="Signing limit"
            labelRight="AR"
          />
        </Modal.Content>
        <Modal.Action passive onClick={() => allowanceModal.setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action
          onClick={() => {
            if (!currentURL) return;
            dispatch(
              setAllowanceLimit(currentURL, Number(allowanceAmount.state))
            );
            allowanceModal.setVisible(false);
          }}
        >
          Ok
        </Modal.Action>
      </Modal>
    </>
  );
}

type AuthType = "connect" | "sign_auth" | "encrypt_auth";
