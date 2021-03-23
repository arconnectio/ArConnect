import React, { useEffect, useRef, useState } from "react";
import { Button, Page, Toggle, Tooltip } from "@geist-ui/react";
import { local } from "chrome-storage-promises";
import { useColorScheme } from "use-color-scheme";
import axios from "axios";
import ardriveLogoLight from "../../assets/ardrive_light.png";
import ardriveLogoDark from "../../assets/ardrive_dark.png";
import styles from "../../styles/views/Archive/view.module.sass";

export default function App() {
  const [safeMode, setSafeMode] = useState(true),
    [archiveData, setArchiveData] = useState({
      url: "",
      content: ""
    }),
    [previewHeight, setPreviewHeight] = useState(0),
    previewItem = useRef<HTMLIFrameElement>(),
    { scheme } = useColorScheme();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [safeMode]);

  async function loadData() {
    try {
      const lastData: { [key: string]: any } =
        typeof chrome !== "undefined"
          ? await local.get("lastArchive")
          : await browser.storage.local.get("lastArchive");

      if (!lastData || !lastData.lastArchive) return window.close();
      if (safeMode)
        setArchiveData({
          url: lastData.lastArchive.url,
          content: (await axios.get(lastData.lastArchive.url)).data.toString()
        });
      else setArchiveData(lastData.lastArchive);

      // wait a bit for it to actually load
      setTimeout(() => {
        const archivePageHeight =
          previewItem.current?.contentWindow?.document.body.scrollHeight;
        if (archivePageHeight) setPreviewHeight(archivePageHeight);
      }, 100);
    } catch {
      window.close();
    }
  }

  return (
    <>
      <div className={styles.Head}>
        <img
          src={scheme === "dark" ? ardriveLogoDark : ardriveLogoLight}
          alt="ArDrive"
          className={styles.ArDrive}
        />
        <Tooltip
          text={
            <p style={{ textAlign: "center", margin: 0 }}>
              This removes tracking and sensitive information
            </p>
          }
          placement="bottomEnd"
        >
          <div className={styles.SafeMode}>
            Safe mode
            <Toggle
              checked={safeMode}
              initialChecked
              onChange={(val) => setSafeMode(val.target.checked)}
            />
          </div>
        </Tooltip>
      </div>
      <Page size="large" className={styles.Preview}>
        <iframe
          title={archiveData.url}
          srcDoc={archiveData.content}
          ref={previewItem as any}
          style={{ height: `${previewHeight}px` }}
          onLoad={() =>
            setPreviewHeight(
              previewItem.current?.contentWindow?.document.body.scrollHeight ??
                0
            )
          }
          // @ts-ignore
          sandbox
        ></iframe>
      </Page>
      <div className={styles.ActionBar}>
        <p>
          This will archive the site seen in this preview on Arweave using{" "}
          <a
            href="https://ardrive.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            ArDrive
          </a>
          .
        </p>
        <Button type="success">Archive</Button>
      </div>
    </>
  );
}
