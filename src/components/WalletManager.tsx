import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import {
  removeWallet,
  renameWallet,
  signOut,
  switchProfile
} from "../stores/actions";
import { Modal, Tooltip, useModal, useToasts } from "@geist-ui/react";
import {
  ChevronDownIcon,
  CopyIcon,
  GearIcon,
  PlusIcon,
  SignOutIcon,
  TrashIcon,
  VerifiedIcon
} from "@primer/octicons-react";
import { useColorScheme } from "use-color-scheme";
import { QRCode } from "react-qr-svg";
import { motion, AnimatePresence } from "framer-motion";
import { goTo } from "react-chrome-extension-router";
import { getVerification, Threshold } from "arverify";
import { browser } from "webextension-polyfill-ts";
import { formatAddress } from "../utils/url";
import { logOut } from "../utils/auth";
import Settings from "../views/Popup/routes/Settings";
import copy from "copy-to-clipboard";
import "../styles/components/Tooltip.sass";
import toastStyles from "../styles/components/SmallToast.module.sass";
import styles from "../styles/components/WalletManager.module.sass";

export default function WalletManager() {
  const profile = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    dispatch = useDispatch(),
    [open, setOpen] = useState(false),
    { scheme } = useColorScheme(),
    logoutModal = useModal(false),
    [showSwitch, setShowSwitch] = useState(false),
    [verifiedAddresses, setVerifiedAddresses] = useState<string[]>([]),
    [showQRCode, setShowQRCode] = useState(false),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings),
    [walletNameSizes, setWalletNameSizes] = useState<{
      [address: string]: number;
    }>({}),
    [, setToast] = useToasts();

  useEffect(() => {
    loadVerifiedAddresses();
    // eslint-disable-next-line
  }, [wallets]);

  // fixup empty names
  useEffect(() => {
    if (open) return;
    for (const [i, wallet] of wallets.entries()) {
      if (wallet.name === "") {
        dispatch(renameWallet(wallet.address, `Account ${i + 1}`));
      }
    }
    // eslint-disable-next-line
  }, [open, wallets]);

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

  function getViewblockLinkForAddress(address: string) {
    return `https://viewblock.io/arweave/address/${address}`;
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
      logOut();
    }
  }

  function currentWalletName() {
    const currentWallet = wallets.find(({ address }) => address === profile);
    if (currentWallet) return currentWallet.name;
    else return "Wallet";
  }

  function switchWallet(address: string) {
    dispatch(switchProfile(address));
    setOpen(false);
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
      <div className={styles.CurrentWallet}>
        <h1 onClick={() => setOpen(!open)}>
          {currentWalletName() || "• • •"}
          {verifiedAddresses.includes(profile) && <VerifiedIcon />}
        </h1>
        <p className={styles.Address}>
          <Tooltip text="Check address on viewblock">
            <a href={getViewblockLinkForAddress(profile)} target="_blank">
              {formatAddress(profile)}
            </a>
          </Tooltip>

          <button
            style={{ marginLeft: ".85em" }}
            onClick={() => {
              copy(profile);
              setToast({
                text: "Copied address to clipboard",
                type: "success"
              });
            }}
          >
            <CopyIcon />
          </button>
          <button onClick={() => setShowQRCode(true)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="13.5"
                y="2.5"
                width="8"
                height="8"
                rx="0.5"
                stroke="currentColor"
              />
              <rect
                x="2.5"
                y="2.5"
                width="8"
                height="8"
                rx="0.5"
                stroke="currentColor"
              />
              <rect
                x="2.5"
                y="13.5"
                width="8"
                height="8"
                rx="0.5"
                stroke="currentColor"
              />
              <rect
                x="13"
                y="18.5"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="18.5"
                y="18.5"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="18.5"
                y="13"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="13"
                y="13"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="5"
                y="16"
                width="3"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="16"
                y="5"
                width="3"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="5"
                y="5"
                width="3"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
            </svg>
          </button>
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
                        onChange={(e) =>
                          dispatch(renameWallet(wallet.address, e.target.value))
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        style={{
                          width: `${walletNameSizes[wallet.address] ?? 0}px`
                        }}
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
                    <p>{formatAddress(wallet.address)}</p>
                  </div>
                  <div
                    className={styles.Remove}
                    onClick={() => deleteWallet(wallet.address)}
                  >
                    <TrashIcon />
                  </div>
                </div>
              ))}
              <div className={styles.Wallet + " " + styles.Options}>
                <Tooltip text="Add wallet">
                  <div
                    className={styles.Action}
                    onClick={() =>
                      browser.tabs.create({
                        url: browser.runtime.getURL("/welcome.html")
                      })
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
              Make sure you have your keyfiles / seedphrases locally or export
              your config in the settings!
            </Modal.Content>
            <Modal.Action passive onClick={() => logoutModal.setVisible(false)}>
              Cancel
            </Modal.Action>
            <Modal.Action
              onClick={() => {
                dispatch(signOut());
                logOut();
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
            className={toastStyles.SmallToast}
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
              <p>{profile}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {wallets.map(({ name, address }, i) => (
        <span
          className={styles.ImitateWalletName}
          key={i}
          ref={(el) => {
            if (!el || el.clientWidth === 0) return;
            if (walletNameSizes[address] === el.clientWidth) return;
            setWalletNameSizes((val) => ({
              ...val,
              [address]: el.clientWidth
            }));
          }}
        >
          {name}
        </span>
      ))}
    </>
  );
}
