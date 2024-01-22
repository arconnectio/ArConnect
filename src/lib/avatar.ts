import Arweave from "arweave";
import { getActiveKeyfile } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";

const arweave = new Arweave({
  host: "ar-io.net",
  port: 443,
  protocol: "https"
});

function toArrayBuffer(data: any) {
  return new Promise((resolve, _) => {
    const fr = new FileReader();

    fr.onload = function () {
      resolve(this.result);
    };

    fr.readAsArrayBuffer(data);
  });
}

function waitFor(delay: number) {
  return new Promise((res) => setTimeout(res, delay));
}

export async function uploadUserAvatar(avatar: File) {
  const wallet = await getActiveKeyfile();

  if (wallet.type === "hardware") {
    return;
  }
  const keyfile = wallet.keyfile;

  try {
    const data = (await toArrayBuffer(avatar)) as ArrayBuffer;
    await waitFor(500);

    const inputTags = [
      { name: "App-Name", value: "ArConnect.io" },
      { name: "Content-Type", value: avatar.type },
      { name: "Type", value: "avatar-update" }
    ];

    const transaction = await arweave.createTransaction(
      {
        data
      },
      keyfile
    );

    inputTags.forEach((tag) => transaction.addTag(tag.name, tag.value));

    await arweave.transactions.sign(transaction, keyfile);

    const uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(
        `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
      );
    }

    const txId = transaction.id;
    console.log("Transaction ID:", txId);

    // remove wallet from memory
    freeDecryptedWallet(keyfile);

    return transaction.id;
  } catch (e) {
    console.log("Unable to upload avatar", e);
  }
}

export const getUserAvatar = async (txId: string) => {
  try {
    const data = await arweave.transactions.getData(txId, { decode: true });
    const blob = new Blob([data], { type: "image" });
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  } catch (e) {
    console.error("Error fetching avatar:", e);
  }
};
