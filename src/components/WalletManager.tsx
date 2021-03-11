import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import {
  removeWallet,
  renameWallet,
  signOut,
  switchProfile
} from "../stores/actions";
import { Modal, Tooltip, useModal } from "@geist-ui/react";
import {
  ChevronDownIcon,
  GearIcon,
  PlusIcon,
  SignOutIcon,
  TrashcanIcon,
  VerifiedIcon
} from "@primer/octicons-react";
import { useColorScheme } from "use-color-scheme";
import { QRCode } from "react-qr-svg";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage } from "../utils/messenger";
import { goTo } from "react-chrome-extension-router";
import { getVerification, Threshold } from "arverify";
import Settings from "../views/Popup/routes/Settings";
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
    [copyStatus, setCopyStatus] = useState(false),
    logoutModal = useModal(false),
    [showSwitch, setShowSwitch] = useState(false),
    [verifiedAddresses, setVerifiedAddresses] = useState<string[]>([]),
    [showQRCode, setShowQRCode] = useState(false),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    adjustSizes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadVerifiedAddresses();
    // eslint-disable-next-line
  }, [wallets]);

  async function loadVerifiedAddresses() {
    const loaded: string[] = [];

    for (const { address } of wallets)
      try {
        if (
          (await getVerification(address, arVerifyTreshold ?? Threshold.MEDIUM))
            .verified
        )
          loaded.push(address);
      } catch {}

    setVerifiedAddresses(loaded);
  }

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
    setShowQRCode(true);
  }

  function switchWallet(address: string) {
    dispatch(switchProfile(address));
    setOpen(false);
    sendMessage({
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
      <div className={styles.CurrentWallet}>
        <h1 onClick={() => setOpen(!open)}>
          {currentWalletName()}
          {verifiedAddresses.includes(profile) && <VerifiedIcon />}
        </h1>
        <p
          onClick={copyAddress}
          className={copyStatus ? styles.Copied : ""}
          title="Click to copy"
        >
          {profile}
        </p>
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
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        value={wallet.name}
                        title="Type to change wallet name"
                        onChange={(e) => {
                          dispatch(
                            renameWallet(wallet.address, e.target.value)
                          );
                          adjustSizes();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        style={{ width: widthForAddress(wallet.address) }}
                      />
                      {verifiedAddresses.includes(wallet.address) && (
                        <Tooltip
                          text={
                            <p style={{ textAlign: "center", margin: "0" }}>
                              Verified on <br />
                              ArVerify
                            </p>
                          }
                          className={styles.VerifiedIcon}
                        >
                          <VerifiedIcon />
                        </Tooltip>
                      )}
                    </div>
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
                <Tooltip text="Settings">
                  <div className={styles.Action} onClick={() => goTo(Settings)}>
                    <GearIcon />
                  </div>
                </Tooltip>
                <Tooltip text="Log out">
                  <div
                    className={styles.Action}
                    onClick={() => logoutModal.setVisible(true)}
                  >
                    <SignOutIcon />
                  </div>
                </Tooltip>
              </div>
            </motion.div>
          )}
          <Modal {...logoutModal.bindings}>
            <Modal.Title>Sign Out</Modal.Title>
            <Modal.Content>
              Do you really want to sign out from all wallets? <br />
              Make sure you have your keyfiles / seedphrases locally!
            </Modal.Content>
            <Modal.Action passive onClick={() => logoutModal.setVisible(false)}>
              Cancel
            </Modal.Action>
            <Modal.Action
              onClick={() => {
                dispatch(signOut());
                logoutModal.setVisible(false);
              }}
            >
              Ok
            </Modal.Action>
          </Modal>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showSwitch && (
          <motion.div
            className={styles.SwitchIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Switched wallet
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            className={styles.QROverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.23, ease: "easeInOut" }}
            onClick={() => setShowQRCode(false)}
          >
            <div className={styles.wrapper}>
              <QRCode
                className={styles.QRCode}
                value={profile}
                bgColor={scheme === "dark" ? "#000000" : "#ffffff"}
                fgColor={scheme === "dark" ? "#ffffff" : "#000000"}
              />
              <p>Copied address</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
