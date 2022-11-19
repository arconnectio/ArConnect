import {
  Wrapper,
  GenerateCard,
  Page,
  Paginator
} from "~components/welcome/Wrapper";
import { checkPasswordValid, jwkFromMnemonic } from "~wallets/generator";
import { AnimatePresence, motion, Variants } from "framer-motion";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { ArrowRightIcon } from "@iconicicons/react";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { useEffect, useState } from "react";
import { addWallet } from "~wallets";
import {
  Button,
  Card,
  Checkbox,
  Loading,
  Spacer,
  Text,
  useCheckbox,
  useInput,
  useToasts
} from "@arconnect/components";
import BackupWalletPage from "~components/welcome/generate/BackupWalletPage";
import ConfirmSeedPage from "~components/welcome/generate/ConfirmSeedPage";
import GeneratedPage from "~components/welcome/generate/GeneratedPage";
import PasswordPage from "~components/welcome/generate/PasswordPage";
import browser from "webextension-polyfill";
import Done from "~components/welcome/Done";
import * as bip39 from "bip39-web-crypto";
import styled from "styled-components";
import Arweave from "arweave";

export default function Generate() {
  // active page
  const [page, setPage] = useState(1);

  // wallet seed
  const [seed, setSeed] = useState("");

  // load seed
  useEffect(() => {
    (async () => {
      const mnemonic = await bip39.generateMnemonic();

      setSeed(mnemonic);
    })();
  }, []);

  // toasts
  const { setToast } = useToasts();

  // generation in progress
  const [generatingWallet, setGeneratingWallet] = useState(false);

  // keyfile
  const [keyfile, setKeyfile] = useState<JWKInterface>();
  const [address, setAddress] = useState<string>();

  // generate wallet
  useEffect(() => {
    (async () => {
      if (seed === "" || generatingWallet) return;
      setGeneratingWallet(true);

      try {
        const arweave = new Arweave(defaultGateway);

        // generate wallet from seedphrase
        const generatedKeyfile = await jwkFromMnemonic(seed);
        const addr = await arweave.wallets.jwkToAddress(generatedKeyfile);

        setKeyfile(generatedKeyfile);
        setAddress(addr);
      } catch (e) {
        console.log("Error generating wallet", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("error_generating_wallet"),
          duration: 2300
        });
      }

      setGeneratingWallet(false);
    })();
  }, [seed]);

  // written down checkbox
  const writtenDown = useCheckbox();

  // sorted words
  const [sorted, setSorted] = useState(false);

  // adding wallet
  const [addingWallet, setAddingWallet] = useState(false);

  // password input
  const passwordInput = useInput("");

  // next button click event
  async function handleBtn() {
    if (page === 1 && !checkPasswordValid(passwordInput.state)) {
      // we check the password strength on page 1
      passwordInput.setStatus("error");

      return setToast({
        type: "error",
        content: browser.i18n.getMessage("password_not_strong"),
        duration: 2300
      });
    } else if (!writtenDown.state && page !== 1) {
      // we check if the written down seed checbox is checked
      // on every page, except page 1
      return;
    } else if (!sorted && page === 3) {
      // we check if the words have been verified
      // by the user sorting them
      return;
    } else if (page < 4) {
      // we go to the next page if we are not on the final one
      return setPage((v) => v + 1);
    } else if (!!keyfile && page === 4) {
      // add wallet on the final page
      setAddingWallet(true);

      try {
        const arweave = new Arweave(defaultGateway);

        // fetch ans data
        const address = await arweave.wallets.jwkToAddress(keyfile);
        let nickname: string;

        try {
          const ansProfile = (await getAnsProfile(address)) as AnsUser;

          if (ansProfile) {
            nickname = ansProfile.currentLabel;
          }
        } catch {}

        // add the wallet
        await addWallet(
          nickname ? { nickname, wallet: keyfile } : keyfile,
          passwordInput.state
        );
      } catch (e) {
        console.log("Failed to add wallet", e);
      }

      setAddingWallet(false);
      setPage((v) => v + 1);
    } else if (page === 5) {
      window.top.close();
    }
  }

  return (
    <Wrapper>
      <GenerateCard>
        <Paginator>
          {Array(5)
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
            {page === 2 && seed && <BackupWalletPage seed={seed} />}
            {page === 3 && seed && (
              <ConfirmSeedPage seed={seed} setSorted={setSorted} />
            )}
            {page === 4 && <GeneratedPage address={address} />}
            {page !== 1 && (
              <>
                <Spacer y={1.25} />
                <Checkbox {...writtenDown.bindings}>
                  {browser.i18n.getMessage("written_down_seed")}
                </Checkbox>
              </>
            )}
            {page === 5 && <Done />}
          </motion.div>
        </AnimatePresence>
        <Spacer y={1.25} />
        <Button
          fullWidth
          disabled={
            (!writtenDown.state && page !== 1) ||
            (!sorted && page === 3) ||
            (!keyfile && page === 4)
          }
          onClick={handleBtn}
          loading={(page === 4 && !keyfile) || addingWallet}
        >
          {browser.i18n.getMessage(page > 3 ? "done" : "next")}
          {page > 4 && <ArrowRightIcon />}
        </Button>
      </GenerateCard>
      <AnimatePresence>
        {generatingWallet && (
          <Generating>
            <Text noMargin>{browser.i18n.getMessage("generating_wallet")}</Text>
            <GeneratingLoading />
          </Generating>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Generating = styled(motion.div).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.23, ease: "easeInOut" }
})`
  position: fixed;
  display: flex;
  align-items: center;
  bottom: 1rem;
  right: 1rem;
  gap: 0.36rem;
`;

const GeneratingLoading = styled(Loading)`
  color: rgb(${(props) => props.theme.theme});
  width: 1.23rem;
  height: 1.23rem;
`;

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};
