import React, { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon
} from "@primer/octicons-react";
import { goTo } from "react-chrome-extension-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import Home from "./Home";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/settings.module.sass";
import { removePermissions } from "../../../stores/actions";

export default function Settings() {
  const [setting, setCurrSetting] = useState<
      "events" | "permissions" | "psts" | "sites"
    >(),
    permissions = useSelector((state: RootState) => state.permissions),
    [opened, setOpened] = useState<{ url: string; opened: boolean }[]>([]),
    dispatch = useDispatch();

  useEffect(() => {
    setOpened(permissions.map(({ url }) => ({ url, opened: false })));
    // eslint-disable-next-line
  }, []);

  function open(url: string) {
    setOpened((val) => [
      ...val.filter((permissionGround) => permissionGround.url !== url),
      { url, opened: !isOpened(url) }
    ]);
  }

  function isOpened(url: string) {
    return (
      opened.find((permissionGround) => permissionGround.url === url)?.opened ??
      false
    );
  }

  function filterWithPermission() {
    return permissions.filter(
      (permissionGroup) => permissionGroup.permissions.length > 0
    );
  }

  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div
          className={SubPageTopStyles.Back}
          onClick={() => {
            if (setting) setCurrSetting(undefined);
            else goTo(Home);
          }}
        >
          <ArrowLeftIcon />
        </div>
        <h1>
          {(setting === "events" && "Events") ||
            (setting === "permissions" && "Permissions") ||
            (setting === "psts" && "Removed PSTs") ||
            (setting === "sites" && "Blocked sites") ||
            "Settings"}
        </h1>
      </div>
      <div className={styles.Settings}>
        {(!setting && (
          <>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("events")}
            >
              <div>
                <h1>Events</h1>
                <p>View security events</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("permissions")}
            >
              <div>
                <h1>Permissions</h1>
                <p>Manage site permissions</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("psts")}
            >
              <div>
                <h1>Removed PSTs</h1>
                <p>Manage removed PSTs</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
            <div
              className={styles.Setting}
              onClick={() => setCurrSetting("sites")}
            >
              <div>
                <h1>Blocked sites</h1>
                <p>Limit access from sites to WeaveMask</p>
              </div>
              <div className={styles.Arrow}>
                <ChevronRightIcon />
              </div>
            </div>
          </>
        )) ||
          (setting === "permissions" && (
            <>
              {(filterWithPermission().length > 0 &&
                filterWithPermission().map((permissionGroup, i) => (
                  <div key={i}>
                    <div
                      className={styles.Setting + " " + styles.SubSetting}
                      onClick={() => open(permissionGroup.url)}
                    >
                      <h1>{permissionGroup.url}</h1>
                      <div className={styles.Arrow}>
                        {(isOpened(permissionGroup.url) && (
                          <ChevronDownIcon />
                        )) || <ChevronRightIcon />}
                      </div>
                    </div>
                    <div className={styles.OptionContent}>
                      {isOpened(permissionGroup.url) &&
                        permissionGroup.permissions.map((perm, j) => (
                          <h1 key={j}>
                            {perm}
                            <div
                              className={styles.RemoveOption}
                              onClick={() =>
                                dispatch(
                                  removePermissions(permissionGroup.url, [perm])
                                )
                              }
                            >
                              <XIcon />
                            </div>
                          </h1>
                        ))}
                    </div>
                  </div>
                ))) || <p>No permissions...</p>}
            </>
          ))}
      </div>
    </>
  );
}
