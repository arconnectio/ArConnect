import {
  Wrapper,
  GenerateCard,
  Page,
  Paginator
} from "~components/welcome/Wrapper";
import { Button, Spacer, useInput, useToasts } from "@arconnect/components";
import { checkPasswordValid, jwkFromMnemonic } from "~wallets/generator";
import { AnimatePresence, motion, Variants } from "framer-motion";
import type { JWKInterface } from "arweave/node/lib/wallet";
import { ArrowRightIcon } from "@iconicicons/react";
import { readFileString } from "~utils/file";
import { useRef, useState } from "react";
import { addWallet } from "~wallets";
import PasswordPage from "~components/welcome/generate/PasswordPage";
import Seed from "~components/welcome/load/Seed";
import Done from "~components/welcome/Done";
import browser from "webextension-polyfill";

export default function Load() {
  // page
  const [page, setPage] = useState(1);

  // password input
  const passwordInput = useInput("");

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

        // add wallet
        await addWallet(walletsToAdd, passwordInput.state);

        setPage(3);
      } catch (e) {
        console.log("Failed to load wallet from mnemonic", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("error_adding_wallets"),
          duration: 2000
        });
      }

      setLoading(false);
    } else if (page === 3) {
      window.top.close();
    }
  }

  return (
    <Wrapper>
      <GenerateCard>
        <Paginator>
          {Array(3)
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
            {page === 1 && <PasswordPage passwordInput={passwordInput} />}
            {page === 2 && (
              <Seed seedInput={seedInput} fileInputRef={fileInputRef} />
            )}
            {page === 3 && <Done />}
          </motion.div>
        </AnimatePresence>
        <Spacer y={1.25} />
        <Button fullWidth onClick={handleBtn} loading={loading}>
          {browser.i18n.getMessage(page > 1 ? "done" : "next")}
          {page === 1 && <ArrowRightIcon />}
        </Button>
      </GenerateCard>
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
