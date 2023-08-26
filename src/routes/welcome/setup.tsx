import { AnimatePresence, type Variants, motion } from "framer-motion";
import { createContext, useEffect, useMemo, useState } from "react";
import { Card, Spacer, useToasts } from "@arconnect/components";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { jwkFromMnemonic } from "~wallets/generator";
import { useLocation, useRoute } from "wouter";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import styled from "styled-components";
import Arweave from "arweave";

import GenerateDone from "./generate/done";
import Confirm from "./generate/confirm";
import Backup from "./generate/backup";

import Password from "./load/password";
import Wallets from "./load/wallets";
import LoadDone from "./load/done";
import Theme from "./load/theme";

/** Wallet generate pages */
const generatePages = [
  <Password />,
  <Backup />,
  <Confirm />,
  <Theme />,
  <GenerateDone />
];

/** Wallet load pages */
const loadPages = [<Password />, <Wallets />, <Theme />, <LoadDone />];

export default function Setup({ setupMode, page }: Props) {
  // location
  const [, setLocation] = useLocation();

  // total page count
  const pageCount = useMemo(
    () => (setupMode === "load" ? loadPages : generatePages).length,
    [setupMode]
  );

  // redirect if not on a page
  useEffect(() => {
    // wrong setup mode
    if (Number.isNaN(page) || page < 1 || page > pageCount) {
      setLocation(`/${setupMode}/1`);
    }
  }, [setupMode, page]);

  // temporarily stored password
  const [password, setPassword] = useState("");

  // check if the user is on the wrong page without a password
  useEffect(() => {
    if (page !== 1 && password === "") {
      setLocation(`/${setupMode}/1`);
    }
  }, [page, password]);

  // is the setup mode "wallet generation"
  const [isGenerateWallet] = useRoute("/generate/:page");

  // toasts
  const { setToast } = useToasts();

  // generate wallet in the background
  const [generatedWallet, setGeneratedWallet] = useState<WalletContextValue>(
    {}
  );

  useEffect(() => {
    (async () => {
      // only generate wallet if the
      // setup mode is wallet generation
      if (!isGenerateWallet || generatedWallet.address) return;

      // prevent user from closing the window
      // while ArConnect is generating a wallet
      window.onbeforeunload = () =>
        browser.i18n.getMessage("close_tab_generate_wallet_message");

      try {
        const arweave = new Arweave(defaultGateway);

        // generate seed
        const seed = await bip39.generateMnemonic();

        setGeneratedWallet({ mnemonic: seed });

        // generate wallet from seedphrase
        const generatedKeyfile = await jwkFromMnemonic(seed);

        setGeneratedWallet((val) => ({ ...val, jwk: generatedKeyfile }));

        // get address
        const address = await arweave.wallets.jwkToAddress(generatedKeyfile);

        setGeneratedWallet((val) => ({ ...val, address }));
      } catch (e) {
        console.log("Error generating wallet", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("error_generating_wallet"),
          duration: 2300
        });
      }

      // reset before unload
      window.onbeforeunload = null;
    })();
  }, [isGenerateWallet]);

  return (
    <Wrapper>
      <SetupCard>
        <Paginator>
          {Array(pageCount)
            .fill("")
            .map((_, i) => (
              <Page key={i} active={page === i + 1} />
            ))}
        </Paginator>
        <Spacer y={1} />
        <PasswordContext.Provider value={{ password, setPassword }}>
          <WalletContext.Provider value={generatedWallet}>
            <AnimatePresence initial={false}>
              <motion.div
                variants={pageAnimation}
                initial="exit"
                animate="init"
                key={page}
              >
                {(setupMode === "load" ? loadPages : generatePages)[page - 1]}
              </motion.div>
            </AnimatePresence>
          </WalletContext.Provider>
        </PasswordContext.Provider>
      </SetupCard>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const SetupCard = styled(Card)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 350px;
  transform: translate(-50%, -50%);
`;

const Paginator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
`;

const Page = styled.div<{ active?: boolean }>`
  width: 2.5rem;
  height: 2px;
  background-color: rgba(
    ${(props) => props.theme.theme + ", " + (props.active ? "1" : ".45")}
  );
  transition: all 0.23s ease-in-out;
`;

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

export const PasswordContext = createContext({
  setPassword: (password: string) => {},
  password: ""
});

export const WalletContext = createContext<WalletContextValue>({});

interface WalletContextValue {
  address?: string;
  mnemonic?: string;
  jwk?: JWKInterface;
}

interface Props {
  setupMode: "generate" | "load";
  page: number;
}
