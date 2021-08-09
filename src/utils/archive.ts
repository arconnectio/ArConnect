import { JWKInterface } from "arweave/web/lib/wallet";
import { v4 as uuidv4 } from "uuid";
import Arweave from "arweave";
import manifest from "../../public/manifest.json";
import Transaction from "arweave/node/lib/transaction";
import { getArDriveTipPercentage, selectTokenHolder } from "./pst";

/**
 * Some basic ArDrive info for transactions
 */
const ardriveClient = "ArDrive-Web";
const ardriveVersion = "0.1.0";
const ArFS = "0.11";
const defaultArDriveMinimumTipAR = 0.000_010_000_000;
/**
 * Create an archive file transaction
 * This will archive the file on Arweave using ArDrive
 *
 * @param arweave Arweave client
 * @param data File info
 *
 * @returns Signed arweave transaction
 */
export async function createArchiveTransaction(
  arweave: Arweave,
  data: ArchiveFileData
) {
  const tx = await arweave.createTransaction(
    {
      data: data.content
    },
    data.keyfile
  );

  tx.addTag("Content-Type", data.contentType);
  tx.addTag("User-Agent", `ArConnect/${manifest.version}`);
  tx.addTag("page:url", data.url);
  tx.addTag("page:title", data.title);
  tx.addTag("page:timestamp", data.timestamp.toString());
  tx.addTag("App-Name", ardriveClient);
  tx.addTag("App-Version", ardriveVersion);

  await arweave.transactions.sign(tx, data.keyfile);

  return tx;
}

interface ArchiveFileData {
  url: string;
  title: string;
  content: string;
  contentType: string;
  timestamp: number;
  keyfile: JWKInterface;
}

/**
 * Create an ArDrive metadata transaction
 * This tells ArDrive where to find the file, and some
 * basic infos in addition.
 *
 * @param arweave Arweave client
 * @param data Metadata
 *
 * @returns Signed arweave transaction
 */
export async function createMetadataTransaction(
  arweave: Arweave,
  data: Metadata
) {
  const tx = await arweave.createTransaction(
    {
      data: JSON.stringify({
        name: data.filename,
        size: getSizeBytes(data.content),
        lastModifiedDate: data.timestamp,
        dataTxId: data.dataTxId,
        dataContentType: data.contentType
      })
    },
    data.keyfile
  );

  tx.addTag("App-Name", ardriveClient);
  tx.addTag("App-Version", ardriveVersion);
  tx.addTag("Content-Type", "application/json");
  tx.addTag("ArFS", ArFS);
  tx.addTag("Entity-Type", "file");
  tx.addTag("Drive-Id", data.driveInfo.id);
  tx.addTag("Unix-Time", data.timestamp.toString());
  tx.addTag("File-Id", uuidv4());
  tx.addTag("Parent-Folder-Id", data.driveInfo.rootFolderId);
  tx.addTag("ArDrive-Client", `ArConnect/${manifest.version}`);

  await arweave.transactions.sign(tx, data.keyfile);

  return tx;
}

interface Metadata {
  filename: string;
  content: string;
  contentType: string;
  timestamp: number;
  dataTxId: string;
  driveInfo: {
    id: string;
    rootFolderId: string;
  };
  keyfile: JWKInterface;
}

/**
 * Get the size of a string in bytes
 *
 * @param data Data to get size of
 *
 * @returns Size in bytes
 */
export function getSizeBytes(data: string) {
  return new TextEncoder().encode(data).length;
}

/**
 * Create a new ArDrive public drive transaction
 *
 * @param arweave Arweave client
 * @param driveName Data about the new drive
 *
 * @returns ArDrive Drive object and create drive transactions
 */
export async function createPublicDrive(
  arweave: Arweave,
  data: DriveTxData
): Promise<{
  drive: Drive;
  txs: Transaction[];
}> {
  /**
   * Infos about the new drive
   */
  const newDrive: Drive = {
    id: uuidv4(),
    name: data.name,
    rootFolderID: uuidv4(),
    rootFolderName: data.name,
    isPrivate: false
  };
  const timestamp = new Date().getTime();

  /**
   * The drive transaction
   */
  const driveTx = await arweave.createTransaction(
    {
      data: JSON.stringify({
        name: newDrive.name,
        rootFolderId: newDrive.rootFolderID
      })
    },
    data.keyfile
  );

  driveTx.addTag("App-Name", ardriveClient);
  driveTx.addTag("App-Version", ardriveVersion);
  driveTx.addTag("Content-Type", "application/json");
  driveTx.addTag("ArFS", ArFS);
  driveTx.addTag("Entity-Type", "drive");
  driveTx.addTag("Unix-Time", timestamp.toString());
  driveTx.addTag("Drive-Id", newDrive.id);
  driveTx.addTag("Drive-Privacy", "public");
  driveTx.addTag("ArDrive-Client", `ArConnect/${manifest.version}`);

  await arweave.transactions.sign(driveTx, data.keyfile);

  /**
   * The root folder transaction
   */
  const rootFolderTx = await arweave.createTransaction(
    {
      data: JSON.stringify({ name: newDrive.name })
    },
    data.keyfile
  );

  rootFolderTx.addTag("App-Name", ardriveClient);
  rootFolderTx.addTag("App-Version", ardriveVersion);
  rootFolderTx.addTag("Content-Type", "application/json");
  rootFolderTx.addTag("ArFS", ArFS);
  rootFolderTx.addTag("Entity-Type", "folder");
  rootFolderTx.addTag("Unix-Time", (timestamp + 1).toString());
  rootFolderTx.addTag("Drive-Id", newDrive.id);
  rootFolderTx.addTag("Folder-Id", newDrive.rootFolderID);
  rootFolderTx.addTag("ArDrive-Client", `ArConnect/${manifest.version}`);

  await arweave.transactions.sign(rootFolderTx, data.keyfile);

  return {
    drive: newDrive,
    txs: [driveTx, rootFolderTx]
  };
}

/**
 * Sends the ardrive fee based on the AR price of data upload
 *
 * @param arweave Arweave client
 * @param keyfile Wallet keyfile
 * @param arPrice Cost of data upload
 *
 * @returns Fee Transaction if successful
 */
export async function sendArDriveFee(
  keyfile: JWKInterface,
  arPrice: number,
  arweave: Arweave
) {
  try {
    // Return if upload cost is zero, this should likely never happen
    if (arPrice <= 0) {
      return;
    }

    // If the fee is too small, we assign a minimum
    let fee = Math.max(
      arPrice * (await getArDriveTipPercentage()),
      defaultArDriveMinimumTipAR
    );

    // Probabilistically select the PST token holder
    const holder = await selectTokenHolder();

    // send a fee.
    const transaction = await arweave.createTransaction(
      {
        target: holder,
        quantity: arweave.ar.arToWinston(fee.toString())
      },
      keyfile
    );

    // Tag file with data upload Tipping metadata
    transaction.addTag("App-Name", ardriveClient);
    transaction.addTag("App-Version", ardriveVersion);
    transaction.addTag("Type", "fee");
    transaction.addTag("Tip-Type", "page archive");
    transaction.addTag("ArDrive-Client", `ArConnect/${manifest.version}`);

    // Sign file
    await arweave.transactions.sign(transaction, keyfile);

    // Submit the transaction
    const response = await arweave.transactions.post(transaction);
    if (response.status === 200 || response.status === 202) {
      console.log(
        "SUCCESS ArDrive fee of %s was submitted with TX %s to %s",
        fee.toFixed(12),
        transaction.id,
        holder
      );
    } else {
      console.log(
        "ERROR submitting ArDrive fee with TX %s",
        transaction.toJSON()
      );
    }
    return transaction;
  } catch (err) {
    console.log(err);
    return "ERROR sending ArDrive fee";
  }
}
interface DriveTxData {
  name: string;
  keyfile: JWKInterface;
}

export interface Drive {
  id: string;
  name: string;
  rootFolderID: string;
  rootFolderName: string;
  isPrivate: boolean;
}
