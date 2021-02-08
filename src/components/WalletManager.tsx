import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import {
  removeWallet,
  renameWallet,
  signOut,
  switchProfile
} from "../stores/actions";
import { Tooltip } from "@geist-ui/react";
import {
  ChevronDownIcon,
  GearIcon,
  PlusIcon,
  SignOutIcon,
  TrashcanIcon
} from "@primer/octicons-react";
import { useColorScheme } from "use-color-scheme";
import { QRCode } from "react-qr-svg";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage } from "../utils/messenger";
import copy from "copy-to-clipboard";
import "../styles/components/Tooltip.sass";
import styles from "../styles/components/WalletManager.module.sass";

export default function WalletManager() {
  const profile = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    dispatch = useDispatch(),
    [open, setOpen] = useState(false),
    [inputSizes, setInputSizes] = useState<
      {
        address: string;
        width: number;
      }[]
    >([]),
    { scheme } = useColorScheme(),
    [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    adjustSizes();
    // eslint-disable-next-line
  }, []);

  function adjustSizes() {
    for (const { address, name } of wallets)
      setInputSizes((val) => [
        ...val.filter((val2) => val2.address !== address),
        { address, width: name.length * 15 + 6 }
      ]);
  }

  function widthForAddress(addr: string) {
    return `${
      inputSizes.find(({ address }) => address === addr)?.width ?? "1"
    }px`;
  }

  function deleteWallet(addr: string) {
    if (wallets.length - 1 > 0) {
      if (profile === addr)
        switchWallet(
          wallets.find(({ address }) => address !== addr)?.address ||
            wallets[0].address
        );
      dispatch(removeWallet(addr));
    } else {
      dispatch(signOut());
    }
  }

  function currentWalletName() {
    const currentWallet = wallets.find(({ address }) => address === profile);
    if (currentWallet) return currentWallet.name;
    else return "Wallet";
  }

  function copyAddress() {
    copy(profile);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 280);
  }

  function switchWallet(address: string) {
    dispatch(switchProfile(address));
    setOpen(false);
    sendMessage({
      type: "switch_wallet_event",
      ext: "weavemask",
      res: true,
      message: "",
      address,
      sender: "popup"
    });
  }

  return (
    <div className={styles.CurrentWallet}>
      <h1 onClick={() => setOpen(!open)}>{currentWalletName()}</h1>
      <Tooltip
        text={
          <>
            <p style={{ textAlign: "center", margin: "0 0 .35em" }}>
              Click to copy address
            </p>
            <QRCode
              className={styles.QRCode}
              value={profile}
              bgColor={scheme === "dark" ? "#000000" : "#ffffff"}
              fgColor={scheme === "dark" ? "#ffffff" : "#000000"}
            />
          </>
        }
        placement="bottom"
        style={{ width: "100%" }}
      >
        <p onClick={copyAddress} className={copyStatus ? styles.Copied : ""}>
          {profile}
        </p>
      </Tooltip>
      <div
        className={styles.Icon + " " + (open ? styles.Open : "")}
        onClick={() => setOpen(!open)}
      >
        <ChevronDownIcon />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.Wallets}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {wallets.map((wallet, i) => (
              <div className={styles.Wallet} key={i}>
                <div
                  className={styles.Info}
                  onClick={() => switchWallet(wallet.address)}
                >
                  <input
                    type="text"
                    value={wallet.name}
                    title="Type to change wallet name"
                    onChange={(e) => {
                      dispatch(renameWallet(wallet.address, e.target.value));
                      adjustSizes();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{ width: widthForAddress(wallet.address) }}
                  />
                  <p>{wallet.address}</p>
                </div>
                <div
                  className={styles.Remove}
                  onClick={() => deleteWallet(wallet.address)}
                >
                  <TrashcanIcon />
                </div>
              </div>
            ))}
            <div className={styles.Wallet + " " + styles.Options}>
              <Tooltip text="Add wallet">
                <div
                  className={styles.Action}
                  onClick={() =>
                    window.open(chrome.runtime.getURL("/welcome.html"))
                  }
                >
                  <PlusIcon />
                </div>
              </Tooltip>
              <Tooltip text="Log out">
                <div className={styles.Action}>
                  <SignOutIcon />
                </div>
              </Tooltip>
              <Tooltip text="Settings">
                <div className={styles.Action}>
                  <GearIcon />
                </div>
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
