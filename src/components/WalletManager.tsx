import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import { removeWallet, renameWallet, switchProfile } from "../stores/actions";
import { Tooltip } from "@geist-ui/react";
import {
  ChevronDownIcon,
  PlusIcon,
  TrashcanIcon
} from "@primer/octicons-react";
import { motion, AnimatePresence } from "framer-motion";
import copy from "copy-to-clipboard";
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
    >([]);

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

  return (
    <div className={styles.CurrentWallet}>
      <h1 onClick={() => setOpen(!open)}>
        {wallets.find(({ address }) => address === profile)?.name ?? ""}
      </h1>
      <Tooltip text="Copy address" placement="bottom" style={{ width: "100%" }}>
        <p onClick={() => copy(profile)}>{profile}</p>
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
                  onClick={() => {
                    dispatch(switchProfile(wallet.address));
                    setOpen(false);
                  }}
                >
                  <input
                    type="text"
                    value={wallet.name}
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
                  className={
                    styles.Remove +
                    " " +
                    (wallets.length > 1 ? "" : styles.DisabledRemove)
                  }
                  onClick={() => {
                    if (wallets.length > 1)
                      dispatch(removeWallet(wallet.address));
                  }}
                >
                  <TrashcanIcon />
                </div>
              </div>
            ))}
            {/** TODO: redirect to add new wallet route/screen */}
            <div className={styles.Wallet + " " + styles.AddWallet}>
              <PlusIcon />
              Add wallet
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
