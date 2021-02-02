import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import { switchProfile } from "../stores/actions";
import { Tooltip } from "@geist-ui/react";
import { ChevronDownIcon } from "@primer/octicons-react";
import copy from "copy-to-clipboard";
import styles from "../styles/components/WalletManager.module.sass";

export default function WalletManager() {
  const profile = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    dispatch = useDispatch();

  return (
    <div className={styles.CurrentWallet}>
      <h1>{wallets.find(({ address }) => address === profile)?.name ?? ""}</h1>
      <Tooltip text="Copy address" placement="bottom" style={{ width: "100%" }}>
        <p onClick={() => copy(profile)}>{profile}</p>
      </Tooltip>
      <div className={styles.Icon}>
        <ChevronDownIcon />
      </div>
    </div>
  );
}
