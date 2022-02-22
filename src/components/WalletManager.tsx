import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import {
  removeWallet,
  renameWallet,
  signOut,
  switchProfile
} from "../stores/actions";
import {
  Tooltip,
  Spacer,
  Modal,
  Button,
  useModal,
  generateAvatarGradient
} from "@verto/ui";
import {
  GearIcon,
  PlusIcon,
  SignOutIcon,
  TrashIcon,
  VerifiedIcon,
  PencilIcon,
  BellIcon,
  CheckCircleIcon,
  ChevronLeftIcon
} from "@primer/octicons-react";
import { UserInterface } from "@verto/js/dist/faces";
import { useColorScheme } from "use-color-scheme";
import { QRCode } from "react-qr-svg";
import { motion, AnimatePresence } from "framer-motion";
import { goTo } from "react-chrome-extension-router";
import { getVerification, Threshold } from "arverify";
import { browser } from "webextension-polyfill-ts";
import { formatAddress } from "../utils/url";
import { logOut } from "../utils/auth";
import Settings from "../views/Popup/routes/Settings";
import toastStyles from "../styles/components/SmallToast.module.sass";
import logo from "../assets/logo.png";
import styles from "../styles/components/WalletManager.module.sass";
import testDP from "../assets/test.png";
import Verto from "@verto/js";
import Home from "../views/Popup/routes/Home";
import "../styles/components/Tooltip.sass";

export default function WalletManager({ pageTitle }: { pageTitle?: string }) {
  const profile = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    storedBalances = useSelector((state: RootState) => state.balances),
    dispatch = useDispatch(),
    [open, setOpen] = useState(false),
    { scheme } = useColorScheme(),
    logoutModal = useModal(false),
    [showSwitch, setShowSwitch] = useState(false),
    [verifiedAddresses, setVerifiedAddresses] = useState<string[]>([]),
    [showQRCode, setShowQRCode] = useState(false),
    [renameWallets, setRenameWallets] = useState(false),
    { arVerifyTreshold } = useSelector((state: RootState) => state.settings),
    [walletNameSizes, setWalletNameSizes] = useState<{
      [address: string]: number;
    }>({});

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

  const [vertoID, setVertoID] = useState<UserInterface>();
  const arweaveConfig = useSelector((state: RootState) => state.arweave);

  useEffect(() => {
    const verto = new Verto();

    verto.user.getUser(profile).then((res) => setVertoID(res));
  }, [profile]);

  return (
    <>
      <div className={styles.CurrentWallet}>
        <div
          className={
            styles.Icon + " " + ((!pageTitle && styles.ArConnectLogo) || "")
          }
          onClick={() => goTo(Home)}
        >
          {(pageTitle && <ChevronLeftIcon size={24} />) || (
            <img src={logo} alt="logo" />
          )}
        </div>
        <h1 onClick={() => setOpen(!open)}>
          {pageTitle ? pageTitle : currentWalletName() || "• • •"}
          {verifiedAddresses.includes(profile) && <VerifiedIcon />}
        </h1>
        <div
          className={
            styles.Icon + " " + (!vertoID?.image ? styles.DummyAvatar : "")
          }
          onClick={() => setOpen((val) => !val)}
          style={{
            background:
              (!vertoID?.image && generateAvatarGradient(profile).gradient) ||
              "transparent"
          }}
        >
          {vertoID?.image && (
            <img src={`https://arweave.net/${vertoID.image}`} alt="profile" />
          )}
        </div>
        {open && (
          <div
            className={styles.WalletMenuBackground}
            onClick={() => setOpen(false)}
          />
        )}
        <AnimatePresence>
          {open && (
            <motion.div
              className={styles.Wallets}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className={styles.ChooseWallet}>choose a wallet</p>
              {wallets.map((wallet, i) => (
                <div className={styles.Wallet} key={i}>
                  <div
                    className={styles.Info}
                    onClick={() => switchWallet(wallet.address)}
                  >
                    <div className={styles.WalletNameWrapper}>
                      {renameWallets ? (
                        <input
                          type="text"
                          value={wallet.name}
                          title="Type to change wallet name"
                          onChange={(e) =>
                            dispatch(
                              renameWallet(wallet.address, e.target.value)
                            )
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          style={{
                            width: "10em",
                            borderBottom: "2px solid #000"
                          }}
                          ref={(element) => element?.focus?.()}
                        />
                      ) : (
                        <p className={styles.WalletName}>{wallet.name}</p>
                      )}

                      <Spacer x={0.45} />

                      {verifiedAddresses.includes(wallet.address) && (
                        <Tooltip
                          text={
                            <p
                              style={{ textAlign: "center", margin: "0" }}
                              className={styles.VerifiedText}
                            >
                              Verified on <br />
                              ArVerify
                            </p>
                          }
                        >
                          <VerifiedIcon />
                        </Tooltip>
                      )}
                    </div>
                    <p>{formatAddress(wallet.address)}</p>
                  </div>
                  {renameWallets ? (
                    <div
                      className={styles.Remove}
                      onClick={() => deleteWallet(wallet.address)}
                    >
                      <TrashIcon />
                    </div>
                  ) : (
                    <h6 className={styles.WalletBalance}>
                      {storedBalances
                        .find((balance) => balance.address === wallet.address)
                        ?.arBalance?.toFixed(3) || ""}
                      <span>AR</span>
                    </h6>
                  )}
                </div>
              ))}
              {renameWallets ? (
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
                  <Tooltip text="Save Changes">
                    <div
                      className={styles.Action}
                      onClick={() => setRenameWallets(!renameWallets)}
                    >
                      <CheckCircleIcon />
                    </div>
                  </Tooltip>
                </div>
              ) : (
                <div className={styles.Wallet + " " + styles.Options}>
                  <Tooltip text="Notifications">
                    <div
                      className={styles.Action}
                      onClick={() =>
                        browser.tabs.create({
                          url: browser.runtime.getURL("/welcome.html")
                        })
                      }
                    >
                      <BellIcon />
                    </div>
                  </Tooltip>
                  <Tooltip text="Edit Wallets">
                    <div
                      className={styles.Action}
                      onClick={() => setRenameWallets(!renameWallets)}
                    >
                      <PencilIcon />
                    </div>
                  </Tooltip>
                  <Tooltip text="Settings">
                    <div
                      className={styles.Action}
                      onClick={() => goTo(Settings)}
                    >
                      <GearIcon />
                    </div>
                  </Tooltip>
                  <Tooltip text="Log out">
                    <div
                      className={styles.Action}
                      onClick={() => logoutModal.setState(true)}
                    >
                      <SignOutIcon />
                    </div>
                  </Tooltip>
                </div>
              )}
            </motion.div>
          )}
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
      <Modal {...logoutModal.bindings} className={styles.LogOutModal}>
        <Modal.Title>Sign Out</Modal.Title>
        <Modal.Content>
          <p>
            Do you really want to sign out from all wallets? <br />
            Make sure you have your keyfiles / seedphrases locally or export
            your config in the settings!
          </p>
          <Spacer y={2.5} />
          <Button
            small
            className={styles.Btn}
            onClick={() => {
              dispatch(signOut());
              logOut();
              logoutModal.setState(false);
            }}
          >
            Okay
          </Button>
        </Modal.Content>
      </Modal>
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
