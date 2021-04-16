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
  Note,
  useTheme,
  useToasts,
  Select
} from "@geist-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "../../stores/reducers";
import { MessageType } from "../../utils/messenger";
import {
  addAllowance,
  setAllowanceLimit,
  setPermissions,
  switchProfile,
  toggleAllowance
} from "../../stores/actions";
import { getRealURL, shortenURL, formatAddress } from "../../utils/url";
import { ChevronRightIcon } from "@primer/octicons-react";
import { Allowance } from "../../stores/reducers/allowances";
import { checkPassword } from "../../utils/auth";
import { browser } from "webextension-polyfill-ts";
import {
  PermissionType,
  PermissionDescriptions
} from "../../utils/permissions";
import toastStyles from "../../styles/components/SmallToast.module.sass";
import styles from "../../styles/views/Auth/view.module.sass";

export default function App() {
  const passwordInput = useInput(""),
    [passwordStatus, setPasswordStatus] = useState<
      "default" | "secondary" | "success" | "warning" | "error"
    >(),
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
    allowanceModal = useModal(false),
    allowanceAmount = useInput("0"),
    allowances = useSelector((state: RootState) => state.allowances),
    [currentAllowance, setCurrentAllowance] = useState<Allowance>(),
    [spendingLimitReached, setSpendingLimitReached] = useState<boolean>(),
    [updateAllowance, setUpdateAllowance] = useState<number>(),
    [allowedPermissions, setAllowedPermissions] = useState<PermissionType[]>(
      []
    ),
    [appInfo, setAppInfo] = useState<IAppInfo>({}),
    theme = useTheme(),
    [, setToast] = useToasts(),
    [quickAdd, setQuickAdd] = useState(true),
    proflie = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    [showSwitch, setShowSwitch] = useState(false);

  useEffect(() => {
    // get the auth param from the url
    const authVal = new URL(window.location.href).searchParams.get("auth");

    // invalid auth
    if (!authVal) {
      browser.runtime.sendMessage({
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
      appInfo?: IAppInfo;
      type?: AuthType;
      url?: string;
      spendingLimitReached?: boolean;
    } = JSON.parse(decodeURIComponent(authVal));

    if (decodedAuthParam.appInfo) setAppInfo(decodedAuthParam.appInfo);

    // if the type does not exist, this is an invalid call
    if (!decodedAuthParam.type) {
      browser.runtime.sendMessage({
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
        ),
        currentPerms: PermissionType[] = existingPermissions?.permissions ?? [],
        currentPermsFiltered = currentPerms.filter((perm) =>
          decodedAuthParam.permissions
            ? !decodedAuthParam.permissions.includes(perm)
            : true
        );

      // set the requested permissions to all requested
      setRequestedPermissions(
        currentPermsFiltered.concat(decodedAuthParam.permissions)
      );
      setAllowedPermissions(
        currentPermsFiltered.concat(decodedAuthParam.permissions)
      );

      if (existingPermissions && existingPermissions.permissions.length > 0) {
        setAlreadyHasPermissions(true);
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

      // decrypt data event
    } else if (decodedAuthParam.type === "decrypt_auth") {
      // check permissions
      if (!checkPermissions(["DECRYPT"], url)) return sendPermissionError();

      // if non of the types matched, this is an invalid auth call
    } else {
      browser.runtime.sendMessage({
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

  // check password
  async function login() {
    setLoading(true);

    // try to login by decrypting
    try {
      if (!(await checkPassword(passwordInput.state))) throw new Error();

      await browser.storage.local.set({ decryptionKey: true });
      setLoggedIn(true);

      if (updateAllowance && currentURL)
        dispatch(setAllowanceLimit(currentURL, updateAllowance));

      // any event that needs authentication, but not the connect event
      if (type !== "connect") {
        if (!currentURL) return urlError();
        else {
          browser.runtime.sendMessage({
            type: getReturnType(),
            ext: "arconnect",
            res: true,
            message: "Success",
            sender: "popup"
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
  }

  // invalid url sent
  function urlError() {
    browser.runtime.sendMessage({
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
    else if (type === "decrypt_auth") return "encrypt_auth_result";
    //
    return "connect_result";
  }

  // accept permissions
  function accept() {
    if (!loggedIn) return;
    if (!currentURL) return urlError();

    dispatch(setPermissions(currentURL, allowedPermissions));

    // give time for the state to update
    setTimeout(() => {
      browser.runtime.sendMessage({
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
    browser.runtime.sendMessage({
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
    browser.runtime.sendMessage({
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
      setCurrentAllowance({
        url: currUrl,
        enabled: true,
        limit: 0.1,
        spent: 0
      });
      allowanceAmount.setState("0.1");
    } else {
      setCurrentAllowance(curr);
      allowanceAmount.setState(curr.limit.toString());
    }
  }

  function switchWallet(address: string) {
    dispatch(switchProfile(address));
    browser.runtime.sendMessage({
      type: "switch_wallet_event",
      ext: "arconnect",
      res: true,
      message: "",
      address,
      sender: "popup"
    });
    setShowSwitch(true);
    setTimeout(() => setShowSwitch(false), 1700);
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
            for
            {(appInfo.name && (
              <span style={{ color: theme.palette.success }}>
                {(appInfo.name &&
                  ((appInfo.name.includes(".") && shortenURL(appInfo.name)) ||
                    appInfo.name)) ||
                  ""}
              </span>
            )) ||
              "This site"}{" "}
            . Please update it or cancel.
            {quickAdd && (
              <>
                <br />
                <span
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={() => {
                    const updateTo = (currentAllowance?.limit ?? 0) + 0.1;

                    setUpdateAllowance(updateTo);
                    allowanceAmount.setState(updateTo.toString());
                    setQuickAdd(false);
                    setToast({
                      text:
                        "The added allowance will be applied after you enter you password",
                      type: "success"
                    });
                  }}
                >
                  Quick add 0.1 AR
                </span>
              </>
            )}
          </Note>
        )}
        {(!loggedIn && (
          <>
            <h1>Sign In</h1>
            {(type === "connect" && (
              <p>
                {(appInfo.name && (
                  <span style={{ color: theme.palette.success }}>
                    {(appInfo.name &&
                      ((appInfo.name.includes(".") &&
                        shortenURL(appInfo.name)) ||
                        appInfo.name)) ||
                      ""}
                  </span>
                )) ||
                  "This site"}{" "}
                wants to connect to your Arweave wallet. Please enter your
                password to continue.
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
              )) ||
              (type === "decrypt_auth" && (
                <p>
                  This site wants to decrypt some data. Please enter your
                  password to continue.
                </p>
              ))}
            {type === "connect" && (
              <>
                <p className={styles.SelectLabel}>Select wallet</p>
                <Select
                  placeholder="Select wallet"
                  value={proflie}
                  className={styles.SelectWallet}
                  onChange={(val) => switchWallet(val as string)}
                >
                  {wallets.map((wallet, i) => (
                    <Select.Option value={wallet.address} key={i}>
                      {formatAddress(wallet.address)}
                    </Select.Option>
                  ))}
                </Select>
                <Spacer y={0.67} />
              </>
            )}
            <Input.Password
              {...passwordInput.bindings}
              status={passwordStatus}
              placeholder="Password..."
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
            <Spacer y={0.73} />
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
                    <li key={i} className={styles.Check + " " + styles.Checked}>
                      <Checkbox
                        checked
                        size="medium"
                        onChange={(e) => {
                          if (!e.target.checked)
                            setAllowedPermissions((val) =>
                              val.filter((perm) => perm !== permission)
                            );
                          else
                            setAllowedPermissions((val) => [
                              ...val,
                              permission
                            ]);
                        }}
                      />
                      {getPermissionDescription(permission)}
                    </li>
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
              <div className={styles.AppInfo}>
                {appInfo.logo && (
                  <img
                    src={appInfo.logo}
                    alt={appInfo.name ?? ""}
                    draggable={false}
                  />
                )}
                {(appInfo.name &&
                  ((appInfo.name.includes(".") && shortenURL(appInfo.name)) ||
                    appInfo.name)) ||
                  ""}
              </div>
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
              {type === "decrypt_auth" && "Decrypting some data."}
            </p>
          )}
      </div>
      <AnimatePresence>
        {showSwitch && (
          <motion.div
            className={toastStyles.SmallToast}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Switched wallet
          </motion.div>
        )}
      </AnimatePresence>
      <Modal {...allowanceModal.bindings}>
        <Modal.Title>Allowance limit</Modal.Title>
        <Modal.Content className={styles.AllowanceModal}>
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
            setUpdateAllowance(Number(allowanceAmount.state));
            allowanceModal.setVisible(false);
          }}
        >
          Ok
        </Modal.Action>
      </Modal>
    </>
  );
}

type AuthType = "connect" | "sign_auth" | "encrypt_auth" | "decrypt_auth";
interface IAppInfo {
  name?: string;
  logo?: string;
}
