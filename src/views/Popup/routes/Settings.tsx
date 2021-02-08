import React from "react";
import { ArrowLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { goTo } from "react-chrome-extension-router";
import Home from "./Home";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/settings.module.sass";

export default function Settings() {
  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div className={SubPageTopStyles.Back} onClick={() => goTo(Home)}>
          <ArrowLeftIcon />
        </div>
        <h1>Settings</h1>
      </div>
      <div className={styles.Settings}>
        <div className={styles.Setting}>
          <div>
            <h1>Events</h1>
            <p>View security events</p>
          </div>
          <div className={styles.Arrow}>
            <ChevronRightIcon />
          </div>
        </div>
        <div className={styles.Setting}>
          <div>
            <h1>Permissions</h1>
            <p>Manage site permissions</p>
          </div>
          <div className={styles.Arrow}>
            <ChevronRightIcon />
          </div>
        </div>
        <div className={styles.Setting}>
          <div>
            <h1>Removed PSTs</h1>
            <p>Manage removed PSTs</p>
          </div>
          <div className={styles.Arrow}>
            <ChevronRightIcon />
          </div>
        </div>
        <div className={styles.Setting}>
          <div>
            <h1>Blocked sites</h1>
            <p>Limit access from sites to WeaveMask</p>
          </div>
          <div className={styles.Arrow}>
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </>
  );
}
