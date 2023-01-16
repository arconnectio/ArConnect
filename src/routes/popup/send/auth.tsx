import {
  Button,
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import { RawStoredTransfer, TRANSFER_TX_STORAGE } from "~utils/storage";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { ArrowUpRightIcon } from "@iconicicons/react";
import { decryptWallet } from "~wallets/encryption";
import { useHardwareApi } from "~wallets/hooks";
import { useHistory } from "~utils/hash_router";
import { Storage } from "@plasmohq/storage";
import { getActiveWallet } from "~wallets";
import { useState } from "react";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";
import Arweave from "arweave/web/common";

export default function SendAuth() {
  // loading
  const [loading, setLoading] = useState(false);

  // hardware api type
  const hardwareApi = useHardwareApi();

  // password input
  const passwordInput = useInput();

  // get transaction from session storage
  async function getTransaction() {
    const storage = new Storage({
      area: "session",
      allSecret: true
    });

    // get raw tx
    const raw = await storage.get<RawStoredTransfer>(TRANSFER_TX_STORAGE);
    const gateway = raw?.gateway || defaultGateway;

    // gateway from raw tx
    const arweave = new Arweave(gateway);

    return {
      type: raw.type,
      gateway,
      transaction: arweave.transactions.fromRaw(raw.transaction)
    };
  }

  // toasts
  const { setToast } = useToasts();

  // router push
  const [push] = useHistory();

  // local wallet sign & send
  async function sendLocal() {
    setLoading(true);

    // get tx and gateway
    const { type, gateway, transaction } = await getTransaction();
    const arweave = new Arweave(gateway);

    // decrypt wallet
    const activeWallet = await getActiveWallet();

    if (activeWallet.type === "hardware") {
      return setLoading(false);
    }

    let keyfile: JWKInterface;

    try {
      keyfile = await decryptWallet(activeWallet.keyfile, passwordInput.state);
    } catch {
      setLoading(false);
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2000
      });
    }

    // set owner
    transaction.setOwner(keyfile.n);

    try {
      // sign
      await arweave.transactions.sign(transaction, keyfile);

      // post tx
      if (type === "native") {
        await arweave.transactions.post(transaction);
      } else {
        const uploader = await arweave.transactions.getUploader(transaction);

        while (!uploader.isComplete) {
          await uploader.uploadChunk();
        }
      }

      setToast({
        type: "success",
        content: browser.i18n.getMessage("sent_tx"),
        duration: 2000
      });
      push(`/transaction/${transaction.id}`);
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("txFailed"),
        duration: 2000
      });
    }

    setLoading(false);
  }

  // hardware wallet sign & send
  async function sendHardware() {}

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("titles_sign")} />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>{browser.i18n.getMessage("sign_enter_password")}</Text>
          <Spacer y={1.5} />
          {!hardwareApi && (
            <Input
              type="password"
              {...passwordInput.bindings}
              label={browser.i18n.getMessage("password")}
              placeholder={browser.i18n.getMessage("enter_password")}
              fullWidth
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                sendLocal();
              }}
            />
          )}
        </Section>
      </div>
      <Section>
        <Button
          disabled={!hardwareApi && passwordInput.state === ""}
          loading={loading}
          fullWidth
          onClick={() => {
            if (hardwareApi) sendHardware();
            else sendLocal();
          }}
        >
          {browser.i18n.getMessage("send")}
          <ArrowUpRightIcon />
        </Button>
      </Section>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
`;
