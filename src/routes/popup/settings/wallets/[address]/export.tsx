import {
  ButtonV2,
  InputV2,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import { type StoredWallet } from "~wallets";
import { useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { decryptWallet, freeDecryptedWallet } from "~wallets/encryption";
import { ExtensionStorage } from "~utils/storage";
import { downloadFile } from "~utils/file";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";

export default function ExportWallet({ address }: Props) {
  // wallets
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const [loading, setLoading] = useState(false);

  // this wallet
  const wallet = useMemo(
    () => wallets?.find((w) => w.address === address),
    [wallets, address]
  );

  // toasts
  const { setToast } = useToasts();

  // password input
  const passwordInput = useInput();

  // export the wallet
  async function exportWallet() {
    setLoading(true);
    if (wallet.type === "hardware") {
      throw new Error("Hardware wallet cannot be exported");
    }

    try {
      // decrypt keyfile
      const decrypted = await decryptWallet(
        wallet.keyfile,
        passwordInput.state
      );

      // download the file
      downloadFile(
        JSON.stringify(decrypted, null, 2),
        "application/json",
        `arweave-keyfile-${address}.json`
      );

      // remove wallet from memory
      freeDecryptedWallet(decrypted);
    } catch (e) {
      console.log("Error exporting wallet", e.message);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("export_wallet_error"),
        duration: 2200
      });
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) return <></>;

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("export_keyfile")} />
      <Wrapper>
        <Text style={{ fontSize: "0.98rem" }}>
          {browser.i18n.getMessage("export_keyfile_description")}
        </Text>
        <InputV2
          small
          type="password"
          placeholder={browser.i18n.getMessage("password")}
          {...passwordInput.bindings}
          fullWidth
        />
        <Spacer y={1} />
        <ButtonV2 fullWidth onClick={exportWallet} loading={loading}>
          {browser.i18n.getMessage("export")}
        </ButtonV2>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
`;

interface Props {
  address: string;
}
