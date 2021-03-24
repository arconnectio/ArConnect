import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  Page,
  Spinner,
  Toggle,
  Tooltip,
  useModal,
  useToasts
} from "@geist-ui/react";
import { local } from "chrome-storage-promises";
import { useColorScheme } from "use-color-scheme";
import manifest from "../../../public/manifest.json";
import axios from "axios";
import ardriveLogoLight from "../../assets/ardrive_light.svg";
import ardriveLogoDark from "../../assets/ardrive_dark.svg";
import styles from "../../styles/views/Archive/view.module.sass";

export default function App() {
  const [safeMode, setSafeMode] = useState(true),
    [archiveData, setArchiveData] = useState({
      url: "",
      content: ""
    }),
    [previewHeight, setPreviewHeight] = useState(0),
    previewItem = useRef<HTMLIFrameElement>(),
    { scheme } = useColorScheme(),
    [previewHTML, setPreviewHTML] = useState(""),
    [, setToast] = useToasts(),
    [fetching, setFetching] = useState(false),
    archiveModal = useModal();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [safeMode]);

  useEffect(() => {
    if (archiveData.url === "" || archiveData.content === "") return;
    render().then(() =>
      // wait a bit for it to actually load
      setTimeout(() => {
        const archivePageHeight =
          previewItem.current?.contentWindow?.document.body.scrollHeight;
        if (archivePageHeight) setPreviewHeight(archivePageHeight);
      }, 100)
    );
    // eslint-disable-next-line
  }, [archiveData]);

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
    } catch {
      window.close();
    }
  }

  async function render(embed = true): Promise<void> {
    setFetching(true);
    if (!embed)
      setToast({
        text: "Page size is larger, trying with embedded images disabled",
        type: "warning"
      });

    const parser = new DOMParser(),
      archiveDocument = parser.parseFromString(
        archiveData.content,
        "text/html"
      ),
      baseEl = document.createElement("base");

    // rebase for assets
    baseEl.setAttribute("href", archiveData.url);
    archiveDocument.head.appendChild(baseEl);

    archiveDocument.head.insertBefore(
      archiveDocument.createComment(
        `Archived with ArConnect ${manifest.version}`
      ),
      archiveDocument.head.childNodes[0]
    );

    // fetch styles
    const fetchAssets: Promise<any>[] = [],
      styles: {
        style: string;
        href: string;
        fullPath: string;
      }[] = [],
      stylesheets = archiveDocument.querySelectorAll(
        `link[rel="stylesheet"],link[rel="preload"][as="style"]`
      ),
      imgs = archiveDocument.querySelectorAll("img"),
      images: {
        src: string;
        content: string;
        type: string;
      }[] = [];

    stylesheets.forEach((style) => {
      const relativeLink = style.getAttribute("href") as string,
        link = new URL(relativeLink, archiveData.url);

      fetchAssets.push(
        axios
          .get(link.href)
          .then(({ data }) =>
            styles.push({
              style: data,
              href: relativeLink,
              fullPath: link.href
            })
          )
          .catch(() =>
            setToast({
              text: "A stylesheet could not be fetched",
              type: "error"
            })
          )
      );
    });
    imgs.forEach((img) => {
      if (embed) {
        img.removeAttribute("sizes");
        img.removeAttribute("srcset");
        img.removeAttribute("data-src");
      }

      const src = img.getAttribute("src") || "",
        link = new URL(src, archiveData.url);

      if (!embed) return img.setAttribute("src", link.href);
      fetchAssets.push(
        axios
          .get(link.href, { responseType: "arraybuffer" })
          .then(({ data, headers }) =>
            images.push({
              src: link.href,
              content: Buffer.from(data, "binary").toString("base64"),
              type: headers["content-type"]
            })
          )
          .catch(() =>
            setToast({ text: "An image could not be fetched", type: "error" })
          )
      );
    });
    archiveDocument.querySelectorAll("iframe").forEach((el) => el.remove());
    archiveDocument
      .querySelectorAll("script,noscript")
      .forEach((el) => el.remove());

    await Promise.all(fetchAssets);

    stylesheets.forEach((link) => {
      const styleEl = archiveDocument.createElement("style"),
        fetchedStyle = styles.find(
          ({ href }) => href === link.getAttribute("href")
        );

      styleEl.textContent = `/** ArConnect resource: ${fetchedStyle?.fullPath} **/\n`;
      styleEl.textContent += fetchedStyle?.style || "";
      link.replaceWith(styleEl);
    });
    if (embed)
      imgs.forEach((img) => {
        const originalSrc = new URL(
            img.getAttribute("src") || "",
            archiveData.url
          ),
          fetchedSrc = images.find(({ src }) => src === originalSrc.href);

        if (!fetchedSrc) return;
        img.setAttribute(
          "src",
          `data:${fetchedSrc.type};base64,${fetchedSrc.content}`
        );
      });

    const html = archiveDocument.documentElement.innerHTML;

    // if greater than 5MB then inline without embedded assets
    if (new TextEncoder().encode(html).length > 3145728)
      return await render(false);
    setPreviewHTML(html);
    setFetching(false);
  }

  async function archive() {}

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
        {fetching && <Spinner className={styles.Fetching} size="large" />}
        <iframe
          title={archiveData.url}
          srcDoc={previewHTML}
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
          <br />
          Credits to the{" "}
          <a
            href="https://github.com/ArweaveTeam"
            target="_blank"
            rel="noopener noreferrer"
          >
            ArweaveTeam
          </a>{" "}
          for the original code.
        </p>
        <Button
          type="success"
          loading={fetching}
          onClick={() => {
            if (fetching) return;
            archiveModal.setVisible(true);
          }}
        >
          Archive
        </Button>
      </div>
      <Modal {...archiveModal.bindings}>
        <Modal.Title>Archive site</Modal.Title>
        <Modal.Content></Modal.Content>
        <Modal.Action passive onClick={() => archiveModal.setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action onClick={archive}>Submit</Modal.Action>
      </Modal>
    </>
  );
}
