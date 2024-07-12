import { isValidMnemonic, jwkFromMnemonic } from "~wallets/generator";
import { ExtensionStorage, OLD_STORAGE_NAME } from "~utils/storage";
import {
  addWallet,
  getWalletKeyLength,
  getWallets,
  setActiveWallet
} from "~wallets";
import type { KeystoneAccount } from "~wallets/hardware/keystone";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { useContext, useEffect, useMemo, useState } from "react";
import { ArrowRightIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { useLocation, useRoute } from "wouter";
import { PasswordContext } from "../setup";
import {
  ButtonV2,
  ModalV2,
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
import { addExpiration } from "~wallets/auth";
import { WalletKeySizeErrorModal } from "~components/modals/WalletKeySizeErrorModal";

export default function Wallets() {
  // password context
  const { password } = useContext(PasswordContext);

  // wallet generation taking longer
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  // migration available
  const [oldState] = useStorage({
    key: OLD_STORAGE_NAME,
    instance: ExtensionStorage
  });

  // migration modal
  const migrationModal = useModal();

  // wallet size error modal
  const walletModal = useModal();

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

  // seedphrase or jwk loaded from
  // the seedphrase component
  const [loadedWallet, setLoadedWallet] = useState<JWKInterface | string>();

  // done
  async function done() {
    setLoading(true);

    // prevent user from closing the window
    // while ArConnect is loading the wallet
    window.onbeforeunload = () =>
      browser.i18n.getMessage("close_tab_load_wallet_message");

    const finishUp = () => {
      // reset before unload
      window.onbeforeunload = null;
      setShowLongWaitMessage(false);
      setLoading(false);
    };

    // validate mnemonic
    if (typeof loadedWallet === "string") {
      try {
        isValidMnemonic(loadedWallet);
      } catch (e) {
        console.log("Invalid mnemonic provided", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalid_mnemonic"),
          duration: 2000
        });
        finishUp();
      }
    }

    try {
      // if the user migrated from a previous version,
      // they already have wallets added
      const existingWallets = await getWallets();

      if (loadedWallet) {
        // load jwk from seedphrase input state
        const startTime = Date.now();

        let jwk =
          typeof loadedWallet === "string"
            ? await jwkFromMnemonic(loadedWallet)
            : loadedWallet;

        let { actualLength, expectedLength } = await getWalletKeyLength(jwk);
        if (expectedLength !== actualLength) {
          if (typeof loadedWallet !== "string") {
            walletModal.setOpen(true);
            finishUp();
            return;
          } else {
            while (expectedLength !== actualLength) {
              setShowLongWaitMessage(Date.now() - startTime > 30000);
              jwk = await jwkFromMnemonic(loadedWallet);
              ({ actualLength, expectedLength } = await getWalletKeyLength(
                jwk
              ));
            }
          }
        }

        // add wallet
        await addWallet(jwk, password);
        await addExpiration();
      } else if (existingWallets.length < 1) {
        // the user has not migrated, so they need to add a wallet
        return finishUp();
      }

      // continue to the next page
      setLocation(`/${params.setup}/${Number(params.page) + 1}`);
    } catch (e) {
      console.log("Failed to load wallet", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_adding_wallet"),
        duration: 2000
      });
    }

    finishUp();
  }

  // done for keystone wallet
  async function keystoneDone(account: KeystoneAccount) {
    // update active address
    // we need this because we don't
    // have any other wallets added yet
    await setActiveWallet(account.address);
    await addExpiration();

    // redirect
    setLocation(`/${params.setup}/${Number(params.page) + 1}`);
  }

  // migration available
  const migrationAvailable = useMemo(
    () => walletsToMigrate.length > 0,
    [walletsToMigrate]
  );

  // migration cancelled
  const [migrationCancelled, setMigrationCancelled] = useState(false);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("provide_seedphrase")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("provide_seedphrase_paragraph")}
      </Paragraph>
      <SeedInput onChange={(val) => setLoadedWallet(val)} onReady={done} />
      {migrationAvailable && (
        <Migrate
          wallets={walletsToMigrate}
          noMigration={migrationCancelled}
          onMigrateClick={() => {
            migrationModal.setOpen(true);
            setMigrationCancelled(false);
          }}
        />
      )}
      <Spacer y={1.25} />
      <KeystoneButton onSuccess={keystoneDone} />
      <Spacer y={1} />
      <ButtonV2 fullWidth onClick={done} loading={loading}>
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon style={{ marginLeft: "5px" }} />
      </ButtonV2>
      {loading && showLongWaitMessage && (
        <Text style={{ textAlign: "center", marginTop: "0.3rem" }}>
          {browser.i18n.getMessage("longer_than_usual")}
        </Text>
      )}
      <ModalV2
        {...migrationModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <>
            <ButtonV2
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

                  // TODO:
                  // remove old storage
                  // await ExtensionStorage.remove(OLD_STORAGE_NAME);
                } catch {}
              }}
            >
              {browser.i18n.getMessage("migrate")}
            </ButtonV2>
            <Spacer y={0.75} />
            <ButtonV2
              fullWidth
              secondary
              onClick={() => {
                migrationModal.setOpen(false);
                setMigrationCancelled(true);
              }}
            >
              {browser.i18n.getMessage("cancel")}
            </ButtonV2>
          </>
        }
      >
        <ModalText heading>
          {browser.i18n.getMessage("migration_available")}
        </ModalText>
        <ModalText>
          {browser.i18n.getMessage("migration_available_paragraph")}
        </ModalText>
        <Spacer y={0.75} />
      </ModalV2>
      <WalletKeySizeErrorModal {...walletModal} back={() => setLocation(`/`)} />
    </>
  );
}

const ModalText = styled(Text)`
  text-align: center;
`;
