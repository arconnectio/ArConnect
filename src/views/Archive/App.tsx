import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Loading,
  Modal,
  Page,
  Progress,
  Select,
  Spacer,
  Spinner,
  Toggle,
  Tooltip,
  useInput,
  useModal,
  useTheme,
  useToasts
} from "@geist-ui/react";
import {
  getSizeBytes,
  createArchiveTransaction,
  createMetadataTransaction,
  Drive,
  createPublicDrive,
  sendArDriveFee,
  defaultArDriveMinimumTipAR
} from "../../utils/archive";
import { useColorScheme } from "use-color-scheme";
import { run } from "ar-gql";
import { useSelector } from "react-redux";
import { RootState } from "../../stores/reducers";
import { FileDirectoryIcon, LockIcon, PlusIcon } from "@primer/octicons-react";
import { formatAddress } from "../../utils/url";
import { checkPassword } from "../../utils/auth";
import { JWKInterface } from "arweave/web/lib/wallet";
import { motion, AnimatePresence } from "framer-motion";
import { browser } from "webextension-polyfill-ts";
import manifest from "../../../public/manifest.json";
import axios from "axios";
import prettyBytes from "pretty-bytes";
import Arweave from "arweave";
import ArdriveLogoLight from "../../assets/ardrive_light.svg";
import ArdriveLogoDark from "../../assets/ardrive_dark.svg";
import {
  getArDriveTipPercentage,
  getWinstonPriceForByteCount
} from "../../utils/pst";
import styles from "../../styles/views/Archive/view.module.sass";

export default function App() {
  const [safeMode, setSafeMode] = useState(true),
    [archiveData, setArchiveData] = useState<{
      url: string;
      content: string;
      type: "page" | "pdf";
    }>({
      url: "",
      content: "",
      type: "page"
    }),
    [previewHeight, setPreviewHeight] = useState(0),
    previewItem = useRef<HTMLIFrameElement>(),
    { scheme } = useColorScheme(),
    [previewHTML, setPreviewHTML] = useState(""),
    [, setToast] = useToasts(),
    [fetching, setFetching] = useState(false),
    archiveModal = useModal(),
    profile = useSelector((state: RootState) => state.profile),
    arweaveConfig = useSelector((state: RootState) => state.arweave),
    wallets = useSelector((state: RootState) => state.wallets),
    arweave = new Arweave(arweaveConfig),
    [drives, setDrives] = useState<Drive[]>(),
    [selectedDrive, setSelectedDrive] = useState<string>(),
    [title, setTitle] = useState(""),
    [archiving, setArchiving] = useState(false),
    [fee, setFee] = useState("0"),
    [usedAddress, setUsedAddress] = useState(profile),
    [timestamp, setTimestamp] = useState<number>(new Date().getTime()),
    [uploadStatus, setUploadStatus] = useState<{
      percentage: number;
      text: string;
    }>(),
    passwordInput = useInput(""),
    driveNameModal = useModal(),
    driveNameInput = useInput("ArConnect Archives"),
    [creatingDrive, setCreatingDrive] = useState(false),
    theme = useTheme();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [safeMode]);

  useEffect(() => {
    loadArDriveDrives();
    // eslint-disable-next-line
  }, [usedAddress]);

  useEffect(() => {
    if (archiveData.url === "") return;
    if (archiveData.content !== "" && archiveData.type !== "pdf") {
      render().then(() =>
        // wait a bit for it to actually load
        setTimeout(() => {
          const archivePageHeight =
            previewItem.current?.contentWindow?.document.body.scrollHeight;
          if (archivePageHeight) setPreviewHeight(archivePageHeight);
        }, 100)
      );
    } else if (archiveData.type === "pdf") loadPdfContent();
    // eslint-disable-next-line
  }, [archiveData]);

  async function loadData() {
    try {
      const lastData = await browser.storage.local.get("lastArchive");

      if (!lastData || !lastData.lastArchive) return window.close();
      if (safeMode && lastData.type !== "pdf")
        setArchiveData({
          url: lastData.lastArchive.url,
          content: (
            (await axios.get(lastData.lastArchive.url)) as any
          ).data.toString(),
          type: lastData.lastArchive.type
        });
      else setArchiveData(lastData.lastArchive);
      setTimestamp(new Date().getTime());

      if (lastData.lastArchive.type === "pdf") {
        const urlSplits: string[] = lastData.lastArchive.url.split("/");
        setTitle(urlSplits[urlSplits.length - 1]);
      }
    } catch {
      window.close();
    }
  }

  async function loadPdfContent(): Promise<string> {
    setFetching(true);
    let data = "";

    try {
      const { data }: any = await axios.get(archiveData.url);
      setPreviewHTML(data);
    } catch {
      setToast({ text: "Error fetching PDF", type: "error" });
    }

    setFetching(false);

    // open modal for pdfs immediately
    archiveModal.setVisible(true);

    return data;
  }

  // scrap site data
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
          .then(({ data }: any) =>
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
          .then(({ data, headers }: any) =>
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
    if (getSizeBytes(html) > 3145728) return await render(false);
    setPreviewHTML(html);
    setFetching(false);
    setTitle(archiveDocument.title);
  }

  // load all ardrive drives
  async function loadArDriveDrives() {
    setDrives(undefined);
    setSelectedDrive(undefined);

    const res = (
      await run(
        `
        query ($addr: String!) {
          transactions(
            first: 100
            owners: [$addr]
            tags: [
              { name: "App-Name", values: ["ArDrive-Desktop", "ArDrive-Web"] }
              { name: "Entity-Type", values: "drive" }
              { name: "Drive-Privacy", values: "public" } 
            ]
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
              }
            }
          }
        }      
      `,
        { addr: usedAddress }
      )
    ).data.transactions.edges.map(({ node: { id, tags } }) => ({
      txid: id,
      id: tags.find(({ name }) => name === "Drive-Id")?.value ?? "",
      isPrivate:
        tags.find(({ name }) => name === "Drive-Privacy")?.value === "true",
      arFsVersion: tags.find(({ name }) => name === "ArFS")?.value ?? ""
    }));

    const loadedDrives: Drive[] = await Promise.all(
      res.map(async ({ txid, id, isPrivate, arFsVersion }) => {
        const { data }: any = await axios.get(`https://arweave.net/${txid}`),
          rootFolderName = await getRootFolderName({
            arFs: arFsVersion,
            driveID: id,
            folderID: data.rootFolderId
          });

        return {
          id,
          isPrivate,
          name: data.name,
          rootFolderID: data.rootFolderId,
          rootFolderName
        };
      })
    );
    const cachedDrives: Drive[] =
      (await browser.storage.local.get("cached_drives"))?.cached_drives ?? [];

    setDrives([
      ...loadedDrives,
      ...cachedDrives.filter(
        ({ id }) => !!loadedDrives.find((loadedDrive) => loadedDrive.id === id)
      )
    ]);
  }

  // get root folder for ArDrive drive
  async function getRootFolderName(props: {
    arFs: string;
    driveID: string;
    folderID: string;
  }): Promise<string> {
    const rootFolderNameQuery = await run(
        `
        query ($arFs: [String!]!, $driveID: [String!]!, $folderID: [String!]!) {
          transactions(
            first: 1
            sort: HEIGHT_ASC
            tags: [
              { name: "ArFS", values: $arFs }
              { name: "Drive-Id", values: $driveID }
              { name: "Folder-Id", values: $folderID }
            ]
          ) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
        props
      ),
      { data }: any = await axios.get(
        `https://arweave.net/${rootFolderNameQuery.data.transactions.edges[0].node.id}`
      );

    return data.name;
  }

  useEffect(() => {
    (async () => {
      const size = getSizeBytes(previewHTML);
      const dataFee = parseFloat(
        arweave.ar.winstonToAr(await arweave.transactions.getPrice(size))
      );
      const communityTip = Math.max(
        dataFee * (await getArDriveTipPercentage()),
        defaultArDriveMinimumTipAR // If the fee is too small, we assign a minimum
      );
      // Sum both the data fees and the community tip
      const totalFee = +dataFee + communityTip;

      setFee(totalFee.toString());
    })();
    // eslint-disable-next-line
  }, [previewHTML]);

  function getWallet(): JWKInterface | undefined {
    const encryptedJWK = wallets.find(
      ({ address }) => address === usedAddress
    )?.keyfile;

    if (!encryptedJWK) {
      setToast({
        text: "Error finding encrypted keyfile for address",
        type: "error"
      });
      return undefined;
    }

    return JSON.parse(atob(encryptedJWK));
  }

  async function archive() {
    if (!(await checkPassword(passwordInput.state)))
      return setToast({ text: "Invalid password", type: "error" });

    setArchiving(true);

    if (archiveData.type === "pdf") await loadPdfContent();

    if (!selectedDrive) {
      setToast({ text: "Please select a drive", type: "error" });
      return setArchiving(false);
    }

    const useJWK = getWallet();
    let dataTxId: string;
    let arPrice = 0;
    if (!useJWK) return setArchiving(false);

    // create data transaction
    try {
      const archiveTx = await createArchiveTransaction(arweave, {
        url: archiveData.url,
        title,
        content: previewHTML,
        contentType:
          archiveData.type === "page" ? "text/html" : "application/pdf",
        timestamp,
        keyfile: useJWK
      });

      const uploader = await arweave.transactions.getUploader(archiveTx);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        setUploadStatus({
          percentage: uploader.pctComplete,
          text: `Archiving site ${uploader.uploadedChunks}/${uploader.totalChunks}`
        });
      }

      dataTxId = archiveTx.id;
      const winston = await getWinstonPriceForByteCount(
        getSizeBytes(previewHTML)
      );
      arPrice = +winston * 0.000_000_000_001;
      await sendArDriveFee(useJWK, arPrice, arweave);
    } catch {
      setToast({
        text: "There was an error while uploading the site",
        type: "error"
      });
      setUploadStatus(undefined);
      return setArchiving(false);
    }

    const driveToSave = drives?.find(({ id }) => id === selectedDrive);

    // check if the selected drive exists
    if (!driveToSave) {
      setToast({
        text: "Site was archived, but there was an error with the selected drive",
        type: "error"
      });
      setUploadStatus(undefined);
      return setArchiving(false);
    }

    // link to an ardrive file location with an ardrive metadata transaction
    try {
      const filename = `arconnect-archive-${title
        .toLowerCase()
        .replace(/[/\\?%*:|"<>]/g, "_")
        .replaceAll(" ", "_")}.${archiveData.type === "page" ? "html" : "pdf"}`;

      const metadataTx = await createMetadataTransaction(arweave, {
        filename,
        content: previewHTML,
        contentType:
          archiveData.type === "page" ? "text/html" : "application/pdf",
        timestamp,
        dataTxId,
        driveInfo: {
          id: driveToSave.id,
          rootFolderId: driveToSave.rootFolderID
        },
        keyfile: useJWK
      });

      const uploader = await arweave.transactions.getUploader(metadataTx);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        setUploadStatus({
          percentage: uploader.pctComplete,
          text: `Linking with ArDrive ${uploader.uploadedChunks}/${uploader.totalChunks}`
        });
      }

      setToast({
        text: `Archived ${archiveData.type}. It should appear in the selected drive shortly.`,
        type: "success",
        delay: 5500
      });
    } catch {
      setToast({
        text: "There was an error while creating the ArDrive transaction",
        type: "error"
      });
    }

    setArchiving(false);
    setUploadStatus(undefined);
    setSelectedDrive(undefined);
    archiveModal.setVisible(false);
  }

  function upperCaseFirst(val: string) {
    return val[0].toUpperCase() + val.substring(1);
  }

  // create a new public ArDrive drive
  async function createDrive() {
    setCreatingDrive(true);

    const useJWK = getWallet();

    if (!useJWK) return setCreatingDrive(false);

    try {
      const { drive, txs } = await createPublicDrive(arweave, {
        name: driveNameInput.state,
        keyfile: useJWK
      });

      for (const tx of txs) {
        const uploader = await arweave.transactions.getUploader(tx);

        while (!uploader.isComplete) {
          await uploader.uploadChunk();
          setUploadStatus({
            percentage: uploader.pctComplete,
            text: `Creating drive ${uploader.uploadedChunks}/${uploader.totalChunks}`
          });
        }
      }

      // cache drive
      const cachedDrives: Drive[] =
        (await browser.storage.local.get("cached_drives"))?.cached_drives ?? [];
      await browser.storage.local.set({
        cached_drives: [...cachedDrives, drive]
      });

      setDrives((val) => [...(val ?? []), drive]);
      driveNameModal.setVisible(false);
      archiveModal.setVisible(true);
      setToast({
        text: `Created new public drive ${drive.name}`,
        type: "success"
      });
    } catch {
      setToast({ text: "Error creating drive", type: "error" });
    }

    setUploadStatus(undefined);
    setCreatingDrive(false);
  }

  return (
    <>
      <div className={styles.Head}>
        <div className={styles.ArDrive}>
          {(scheme === "dark" && <ArdriveLogoDark />) || <ArdriveLogoLight />}
        </div>
        <Tooltip
          text={
            <p style={{ textAlign: "center", margin: 0 }}>
              {archiveData.type === "pdf"
                ? "Not available for pdfs"
                : "This removes tracking and sensitive information"}
            </p>
          }
          placement="bottomEnd"
        >
          <div
            className={styles.SafeMode}
            style={{ opacity: archiveData.type === "pdf" ? 0.5 : 1 }}
          >
            Safe mode
            <Toggle
              checked={safeMode}
              disabled={archiveData.type === "pdf"}
              initialChecked
              onChange={(val) => setSafeMode(val.target.checked)}
            />
          </div>
        </Tooltip>
      </div>
      <Page scale={2} className={styles.Preview}>
        {fetching && <Spinner className={styles.Fetching} scale={2} />}
        {(archiveData.type === "page" && (
          <iframe
            title={title}
            srcDoc={previewHTML}
            ref={previewItem as any}
            style={{ height: `${previewHeight}px` }}
            onLoad={() =>
              setPreviewHeight(
                previewItem.current?.contentWindow?.document.body
                  .scrollHeight ?? 0
              )
            }
            // @ts-ignore
            sandbox
          ></iframe>
        )) || (
          <div style={{ height: "75vh", position: "relative" }}>
            <h1
              style={{
                margin: 0,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center"
              }}
            >
              No preview available for pdfs
            </h1>
          </div>
        )}
      </Page>
      <div className={styles.ActionBar}>
        <p>
          This will archive the{" "}
          {(archiveData.type === "page" && "site") || "pdf file"} seen in this
          preview on Arweave using{" "}
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
            setToast({
              text: "This feature is still in beta",
              type: "warning"
            });
            archiveModal.setVisible(true);
          }}
        >
          Archive
        </Button>
      </div>
      <Modal {...driveNameModal.bindings}>
        <Modal.Title>Create a Drive</Modal.Title>
        <Modal.Content className={styles.Modal}>
          <p style={{ textAlign: "center" }}>
            You don't have a public{" "}
            <a
              href="https://ardrive.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              ArDrive
            </a>{" "}
            drive yet. Please create one.
          </p>
          <h2>Drive name</h2>
          <Input
            placeholder="Enter drive name..."
            {...driveNameInput.bindings}
            width="100%"
          />
          <AnimatePresence>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.35 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.35 }}
                transition={{ duration: 0.23, ease: "easeInOut" }}
              >
                <Spacer h={1} />
                <p>{uploadStatus.text}</p>
                <Progress value={uploadStatus.percentage} type="success" />
              </motion.div>
            )}
          </AnimatePresence>
        </Modal.Content>
        <Modal.Action passive onClick={() => driveNameModal.setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action
          onClick={createDrive}
          disabled={driveNameInput.state === ""}
          loading={creatingDrive}
        >
          Create
        </Modal.Action>
      </Modal>
      <Modal {...archiveModal.bindings}>
        <Modal.Title>Archive {archiveData.type}</Modal.Title>
        <Modal.Content className={styles.Modal}>
          <h2>Please select a drive</h2>
          {(drives &&
            ((drives.length !== 0 && (
              <>
                {drives.map((drive, i) => (
                  <div
                    className={
                      styles.Drive +
                      " " +
                      (drive.isPrivate ? styles.DisabledDrive : "") +
                      " " +
                      (selectedDrive === drive.id ? styles.SelectedDrive : "")
                    }
                    key={i}
                    title={
                      drive.isPrivate
                        ? "You cannot save to a private drive for now..."
                        : undefined
                    }
                    onClick={() => setSelectedDrive(drive.id)}
                  >
                    <FileDirectoryIcon />
                    {drive.name}
                    <span className={styles.RootFolder}>
                      /{drive.rootFolderName}
                    </span>
                    {drive.isPrivate && <LockIcon size={24} />}
                  </div>
                ))}
                <div
                  className={styles.Drive}
                  onClick={() => {
                    driveNameModal.setVisible(true);
                    archiveModal.setVisible(false);
                  }}
                  style={{ justifyContent: "center" }}
                >
                  <PlusIcon />
                  <span>Create new</span>
                </div>
              </>
            )) || (
              <p>
                No drives for this address. Please create one{" "}
                <span
                  style={{ color: theme.palette.success, cursor: "pointer" }}
                  onClick={() => {
                    driveNameModal.setVisible(true);
                    archiveModal.setVisible(false);
                  }}
                >
                  here
                </span>
                .
              </p>
            ))) || <Loading />}
          <Spacer h={1} />
          <h2>Notice</h2>
          <p>
            This will archive the{" "}
            {(archiveData.type === "page" && "site") || "pdf file"} on Arweave
            using an ArDrive public drive. You will be able to find it there,
            shortly after the transaction has been mined.
          </p>
          <p>
            <b>
              Please make sure there is not personal information present, as
              this data will be archived permanently.
            </b>
          </p>
          <h2>Wallet</h2>
          <Select
            value={usedAddress}
            onChange={(val) => setUsedAddress(val as string)}
            style={{ width: "100%" }}
          >
            {wallets.map((wallet, i) => (
              <Select.Option key={i} value={wallet.address}>
                {formatAddress(wallet.address)}
              </Select.Option>
            ))}
          </Select>
          <Spacer h={1} />
          <h2>{upperCaseFirst(archiveData.type)} title</h2>
          <p>{title}</p>
          <h2>{upperCaseFirst(archiveData.type)} URL</h2>
          <p>
            <a href={archiveData.url} target="_blank" rel="noopener noreferrer">
              {archiveData.url}
            </a>
          </p>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "50%" }}>
              <h2>{upperCaseFirst(archiveData.type)} size</h2>
              <p>{prettyBytes(getSizeBytes(previewHTML))}</p>
            </div>
            <div>
              <h2>Fee</h2>
              <p>{fee} AR</p>
            </div>
          </div>
          <AnimatePresence>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.35 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.35 }}
                transition={{ duration: 0.23, ease: "easeInOut" }}
              >
                <p>{uploadStatus.text}</p>
                <Progress value={uploadStatus.percentage} type="success" />
                <Spacer h={1} />
              </motion.div>
            )}
          </AnimatePresence>
          <h2>Password</h2>
          <Input.Password
            placeholder="Enter your password..."
            {...passwordInput.bindings}
            width="100%"
          />
        </Modal.Content>
        <Modal.Action passive onClick={() => archiveModal.setVisible(false)}>
          Cancel
        </Modal.Action>
        <Modal.Action
          onClick={archive}
          disabled={!selectedDrive || passwordInput.state === ""}
          loading={archiving}
        >
          Submit
        </Modal.Action>
      </Modal>
    </>
  );
}
