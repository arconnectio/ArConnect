import { AnimatePresence, type Variants, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { Card, Spacer, useToasts } from "@arconnect/components";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { jwkFromMnemonic } from "~wallets/generator";
import { useLocation, useRoute } from "wouter";
import { ArrowLeftIcon } from "@iconicicons/react";
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
import { defaultGateway } from "~gateways/gateway";
import Pagination, { Status } from "~components/Pagination";

/** Wallet generate pages */
const generatePages = [
  <Password />,
  <Backup />,
  <Confirm />,
  <Theme />,
  <GenerateDone />
];
const generateTitles = [
  "password",
  "backup",
  "confirm",
  "setting_display_theme",
  "done"
];

/** Wallet load pages */
const loadPages = [<Password />, <Wallets />, <Theme />, <LoadDone />];
const loadTitles = [
  "password",
  "setting_wallets",
  "setting_display_theme",
  "done"
];

export default function Setup({ setupMode, page }: Props) {
  // location
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");

  // total page count
  const pageCount = useMemo(
    () => (setupMode === "load" ? loadTitles : generateTitles).length,
    [setupMode]
  );
  const pageTitles = useMemo(
    () => (setupMode === "load" ? loadTitles : generateTitles),
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

  const navigate = () => {
    setLocation(`/${params.setup}/${page - 1}`);
  };

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

  // animate content sice
  const [contentSize, setContentSize] = useState<number>(0);

  const contentRef = useCallback<(el: HTMLDivElement) => void>((el) => {
    if (!el) return;

    const obs = new ResizeObserver(() => {
      if (!el || el.clientHeight <= 0) return;
      setContentSize(el.clientHeight);
    });

    obs.observe(el);
  }, []);

  return (
    <Wrapper>
      <Spacer y={2} />
      <SetupCard>
        <HeaderContainer>
          {page === 1 ? <Spacer /> : <BackButton onClick={navigate} />}
          <PaginationContainer>
            {pageTitles.map((title, i) => (
              <Pagination
                key={i}
                index={i + 1}
                status={
                  page === i + 1
                    ? Status.ACTIVE
                    : page > i + 1
                    ? Status.COMPLETED
                    : Status.FUTURE
                }
                title={title}
                hidden={
                  i === 0
                    ? "leftHidden"
                    : i === pageCount - 1
                    ? "rightHidden"
                    : "none"
                }
              />
            ))}
          </PaginationContainer>
          <Spacer />
        </HeaderContainer>
        <Spacer y={1.5} />
        <PasswordContext.Provider value={{ password, setPassword }}>
          <WalletContext.Provider value={generatedWallet}>
            <Content>
              <PageWrapper style={{ height: contentSize }}>
                <AnimatePresence initial={false}>
                  <Page key={page} ref={contentRef}>
                    {
                      (setupMode === "load" ? loadPages : generatePages)[
                        page - 1
                      ]
                    }
                  </Page>
                </AnimatePresence>
              </PageWrapper>
            </Content>
          </WalletContext.Provider>
        </PasswordContext.Provider>
      </SetupCard>
      <Spacer y={2} />
    </Wrapper>
  );
}

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Content = styled.div`
  padding: 0 24px 20px;
  overflow: hidden;
`;

const PageWrapper = styled.div`
  position: relative;
  transition: height 0.17s ease;
`;

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

const Page = styled(motion.div).attrs({
  variants: pageAnimation,
  initial: "exit",
  animate: "init"
})`
  position: absolute;
  width: 100%;
  height: max-content;
  left: 0;
  top: 0;
`;

const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  padding: 20px 24px 0;
`;

const BackButton = styled(ArrowLeftIcon)<{ hidden?: boolean }>`
  font-size: 1.6rem;
  display: ${(props) => props.hidden && "none"}
  width: 1em;
  height: 1em;
  color: #aeadcd;
  z-index: 2;

  &:hover {
    cursor: pointer;
  }

  path {
    stroke-width: 1.75 !important;
  }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  flex-direction: column;
`;

const SetupCard = styled(Card)`
  padding: 0;
  width: 440px;
`;

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
