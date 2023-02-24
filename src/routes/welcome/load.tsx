import {
  Button,
  Modal,
  Spacer,
  useInput,
  useModal,
  useToasts,
  Text
} from "@arconnect/components";
import { checkPasswordValid, jwkFromMnemonic } from "~wallets/generator";
import { AnimatePresence, motion, Variants } from "framer-motion";
import type { JWKInterface } from "arweave/node/lib/wallet";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { getStorageConfig } from "~utils/storage";
import { readFileString } from "~utils/file";
import { Storage } from "@plasmohq/storage";
import {
  Wrapper,
  GenerateCard,
  Page,
  Paginator
} from "~components/welcome/Wrapper";
import { addWallet, setActiveWallet } from "~wallets";
import PasswordPage from "~components/welcome/generate/PasswordPage";
import KeystoneButton from "~components/hardware/KeystoneButton";
import Migrate from "~components/welcome/load/Migrate";
import Seed from "~components/welcome/load/Seed";
import Theme from "~components/welcome/Theme";
import browser from "webextension-polyfill";
import Done from "~components/welcome/Done";
import styled from "styled-components";

const OLD_STORAGE_NAME = "persist:root";

export default function Load() {
  // page
  const [page, setPage] = useState(1);

  // password input
  const passwordInput = useInput("");

  // second password input
  const validPasswordInput = useInput("");

  // seed input
  const seedInput = useInput("");

  // toasts
  const { setToast } = useToasts();

  // loading
  const [loading, setLoading] = useState(false);

  // wallets file input
  const fileInputRef = useRef<HTMLInputElement>();

  // handle next btn click
  async function handleBtn() {
    if (page === 1) {
      if (validPasswordInput.state !== passwordInput.state) {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("passwords_not_match"),
          duration: 2300
        });
      }

      if (checkPasswordValid(passwordInput.state)) {
        setPage((v) => v + 1);
      } else {
        // check password strength
        passwordInput.setStatus("error");

        return setToast({
          type: "error",
          content: browser.i18n.getMessage("password_not_strong"),
          duration: 2300
        });
      }
    } else if (page === 2) {
      const files = fileInputRef?.current?.files;

      if (!files && seedInput.state === "") return;
      setLoading(true);

      try {
        const walletsToAdd: JWKInterface[] = [];

        // generate from mnemonic
        if (seedInput.state !== "") {
          const wallet = await jwkFromMnemonic(seedInput.state);

          walletsToAdd.push(wallet);
        }

        // load from files
        if (files) {
          for (const wallet of files) {
            const jwkText = await readFileString(wallet);
            const jwk = JSON.parse(jwkText);

            walletsToAdd.push(jwk);
          }
        }

        // load migrated wallets
        if (allowMigration && walletsToMigrate.length > 0) {
          walletsToAdd.push(...walletsToMigrate);
        }

        // add wallet
        await addWallet(walletsToAdd, passwordInput.state);

        // remove old storage, but only after we added the wallet
        // this is useful in case adding the wallets fail,
        // because the error will prevent the old storage from
        // being removed
        if (allowMigration && walletsToMigrate.length > 0) {
          const storage = new Storage(getStorageConfig());

          await storage.remove(OLD_STORAGE_NAME);
        }

        setPage(3);
      } catch (e) {
        console.log("Failed to load wallet", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("error_adding_wallets"),
          duration: 2000
        });
      }

      setLoading(false);
    } else if (page === 3) {
      setPage(4);
    } else if (page === 4) {
      window.top.close();
    }
  }

  // migration available
  const [oldState] = useStorage({
    key: OLD_STORAGE_NAME,
    area: "local",
    isSecret: true
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

  // allow migration
  const [allowMigration, setAllowMigration] = useState(false);

  return (
    <Wrapper>
      <GenerateCard>
        <Paginator>
          {Array(4)
            .fill("")
            .map((_, i) => (
              <Page key={i} active={page === i + 1} />
            ))}
        </Paginator>
        <Spacer y={1} />
        <AnimatePresence initial={false}>
          <motion.div
            variants={pageAnimation}
            initial="exit"
            animate="init"
            key={page}
          >
            {page === 1 && (
              <PasswordPage
                passwordInput={passwordInput}
                validPasswordInput={validPasswordInput}
              />
            )}
            {page === 2 && (
              <>
                <Seed seedInput={seedInput} fileInputRef={fileInputRef} />
                {walletsToMigrate.length > 0 && allowMigration && (
                  <Migrate wallets={walletsToMigrate} />
                )}
              </>
            )}
            {page === 3 && <Theme />}
            {page === 4 && <Done />}
          </motion.div>
        </AnimatePresence>
        <Spacer y={1.25} />
        {page === 2 && (
          <>
            <KeystoneButton
              onSuccess={async (account) =>
                await setActiveWallet(account.address)
              }
            />
            <Spacer y={1} />
          </>
        )}
        <Button fullWidth onClick={handleBtn} loading={loading}>
          {browser.i18n.getMessage(page > 1 ? "done" : "next")}
          {page === 1 && <ArrowRightIcon />}
        </Button>
      </GenerateCard>
      <Modal {...migrationModal.bindings}>
        <ModalText heading>
          {browser.i18n.getMessage("migration_available")}
        </ModalText>
        <ModalText>
          {browser.i18n.getMessage("migration_available_paragraph")}
        </ModalText>
        <Spacer y={1.75} />
        <Button
          fullWidth
          onClick={() => {
            setAllowMigration(true);
            setToast({
              type: "info",
              content: browser.i18n.getMessage("migration_confirmation"),
              duration: 2200
            });
            migrationModal.setOpen(false);
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
    </Wrapper>
  );
}

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

const ModalText = styled(Text)`
  text-align: center;
`;
