import type { JWKInterface } from "arweave/web/lib/wallet";
import { useContext, useEffect, useState } from "react";
import { addWallet, setActiveWallet } from "~wallets";
import { jwkFromMnemonic } from "~wallets/generator";
import { ArrowRightIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useLocation, useRoute } from "wouter";
import { PasswordContext } from "../setup";
import {
  Button,
  Modal,
  Spacer,
  Text,
  useModal,
  useToasts
} from "@arconnect/components";
import KeystoneButton from "~components/hardware/KeystoneButton";
import Migrate from "~components/welcome/load/Migrate";
import SeedInput from "~components/SeedInput";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";

const OLD_STORAGE_NAME = "persist:root";

export default function Wallets() {
  // password context
  const { password } = useContext(PasswordContext);

  // migration available
  const [oldState] = useStorage({
    key: OLD_STORAGE_NAME,
    instance: ExtensionStorage
  });

  // migration modal
  const migrationModal = useModal();

  // wallets to migrate
  const [walletsToMigrate, setWalletsToMigrate] = useState<JWKInterface[]>([]);

  useEffect(() => {
    try {
      if (!oldState.wallets) {
        return migrationModal.setOpen(false);
      }

      const oldWallets: {
        address: string;
        keyfile: string;
        name: string;
      }[] = JSON.parse(oldState.wallets);
      const parsedWallets: JWKInterface[] = [];

      // parse old wallets
      for (let i = 0; i < oldWallets.length; i++) {
        const w = oldWallets[i];

        if (!w.keyfile) continue;

        try {
          const keyfile: JWKInterface = JSON.parse(atob(w.keyfile));

          parsedWallets.push(keyfile);
        } catch {}
      }

      setWalletsToMigrate(parsedWallets);

      // open modal
      migrationModal.setOpen(parsedWallets.length > 0);
    } catch {
      migrationModal.setOpen(false);
    }
  }, [oldState]);

  // toasts
  const { setToast } = useToasts();

  // route
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");
  const [, setLocation] = useLocation();

  // loading
  const [loading, setLoading] = useState(false);

  // wallet loaded from seed input
  const [loadedWallet, setLoadedWallet] = useState<JWKInterface>();

  // seedphrase from seed input
  const [seedphrase, setSeedphrase] = useState<string>();

  // done
  async function done() {
    if (!loadedWallet) return;
    setLoading(true);

    try {
      // add wallet from seedphrase input
      await addWallet(
        loadedWallet || (await jwkFromMnemonic(seedphrase)),
        password
      );

      // continue to the next page
      setLocation(`/${params.setup}/${Number(params.page) + 1}`);
    } catch (e) {
      console.log("Failed to load wallet", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_adding_wallets"),
        duration: 2000
      });
    }

    setLoading(false);
  }

  return (
    <>
      <Text heading>{browser.i18n.getMessage("provide_seedphrase")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("provide_seedphrase_paragraph")}
      </Paragraph>
      <SeedInput
        onWalletRead={(wallet) => setLoadedWallet(wallet)}
        onChange={(val) => setSeedphrase(val)}
        onReady={done}
      />
      {walletsToMigrate.length > 0 && <Migrate wallets={walletsToMigrate} />}
      <Spacer y={1.25} />
      <KeystoneButton
        onSuccess={async (account) => await setActiveWallet(account.address)}
      />
      <Spacer y={1} />
      <Button fullWidth onClick={done} loading={loading}>
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon />
      </Button>
      <Modal
        {...migrationModal.bindings}
        root={document.getElementById("__plasmo")}
      >
        <ModalText heading>
          {browser.i18n.getMessage("migration_available")}
        </ModalText>
        <ModalText>
          {browser.i18n.getMessage("migration_available_paragraph")}
        </ModalText>
        <Spacer y={1.75} />
        <Button
          fullWidth
          onClick={async () => {
            try {
              // add migrated wallets
              await addWallet(walletsToMigrate, password);

              // confirmation toast
              setToast({
                type: "info",
                content: browser.i18n.getMessage("migration_confirmation"),
                duration: 2200
              });
              migrationModal.setOpen(false);

              // remove old storage
              await ExtensionStorage.remove(OLD_STORAGE_NAME);
            } catch {}
          }}
        >
          {browser.i18n.getMessage("migrate")}
        </Button>
        <Spacer y={0.75} />
        <Button
          fullWidth
          secondary
          onClick={() => migrationModal.setOpen(false)}
        >
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Modal>
    </>
  );
}

const ModalText = styled(Text)`
  text-align: center;
`;
