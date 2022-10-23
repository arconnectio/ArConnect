import type { JWKInterface } from "arweave/web/lib/wallet";
import { AnimatePresence, motion } from "framer-motion";
import { defaultGateway } from "~applications/gateway";
import { useEffect, useMemo, useState } from "react";
import { jwkFromMnemonic } from "~wallets/generator";
import { formatAddress } from "~utils/format";
import {
  Button,
  Card,
  Checkbox,
  Loading,
  Spacer,
  Text,
  useCheckbox,
  useToasts
} from "@arconnect/components";
import {
  ArrowRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon
} from "@iconicicons/react";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import Arweave from "arweave";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { addWallet } from "~wallets";

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

  // generate wallet
  useEffect(() => {
    (async () => {
      if (seed === "" || generatingWallet) return;
      setGeneratingWallet(true);

      try {
        const arweave = new Arweave(defaultGateway);

        // generate wallet from seedphrase
        const generatedKeyfile = await jwkFromMnemonic(seed);
        const address = await arweave.wallets.jwkToAddress(generatedKeyfile);

        setKeyfile(generatedKeyfile);

        setToast({
          type: "success",
          content: browser.i18n.getMessage("generated_wallet", [
            formatAddress(address, 6)
          ]),
          duration: 2300
        });
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

  // next button click event
  async function handleBtn() {
    if (!writtenDown.state || (!sorted && page === 2)) return;
    if (page !== 3) setPage((v) => v + 1);
    else if (!!keyfile && page === 3) {
      // add wallet
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
          password
        );
        window.top.close();
      } catch (e) {
        console.log("Failed to add wallet", e);
      }

      setAddingWallet(false);
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
        {page === 1 && seed && <BackupWalletPage seed={seed} />}
        {page === 2 && seed && (
          <ConfirmSeedPage seed={seed} setSorted={setSorted} />
        )}
        <Spacer y={1.25} />
        <Checkbox {...writtenDown.bindings}>
          {browser.i18n.getMessage("written_down_seed")}
        </Checkbox>
        <Spacer y={1.25} />
        <Button
          fullWidth
          disabled={
            !writtenDown.state ||
            (!sorted && page === 2) ||
            (!keyfile && page === 3)
          }
          onClick={handleBtn}
          loading={(page === 3 && !keyfile) || addingWallet}
        >
          {browser.i18n.getMessage(page === 3 ? "done" : "next")}
          {page !== 3 && <ArrowRightIcon />}
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

const BackupWalletPage = ({ seed }: { seed: string }) => {
  // seed blur status
  const [shown, setShown] = useState(false);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("backup_wallet_title")}</Text>
      <Paragraph>{browser.i18n.getMessage("backup_wallet_content")}</Paragraph>
      <SeedContainer onClick={() => setShown((val) => !val)}>
        <Seed shown={shown}>{seed}</Seed>
        <SeedShownIcon as={shown ? EyeIcon : EyeOffIcon} />
      </SeedContainer>
      <Spacer y={0.5} />
      <CopySeed onClick={() => copy(seed)}>
        <CopyIcon /> {browser.i18n.getMessage("copySeed")}
      </CopySeed>
    </>
  );
};

const ConfirmSeedPage = ({
  seed,
  setSorted
}: {
  seed: string;
  setSorted: (v) => any;
}) => {
  // mnemonic words array
  const words = useMemo(
    () => seed.split(" ").sort(() => Math.random() - 0.5),
    [seed]
  );

  // user ordered words
  const [userOrdered, setUserOrdered] = useState<string[]>([]);

  // get the i + 1 of a word
  const getCountOf = (word: string) => {
    const index = userOrdered.findIndex((v) => v === word);

    if (index >= 0) return index + 1;
    else return false;
  };

  // toasts
  const { setToast } = useToasts();

  // check order
  useEffect(() => {
    if (userOrdered.length !== words.length) return;

    for (let i = 0; i < words.length; i++) {
      if (userOrdered[i] !== seed.split(" ")[i]) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalid_seed_order"),
          duration: 2200
        });
        setSorted(false);
        setUserOrdered([]);
        return;
      }
    }

    setToast({
      type: "success",
      content: browser.i18n.getMessage("correct"),
      duration: 2000
    });
    setSorted(true);
  }, [words, userOrdered, seed]);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("confirm_seed")}</Text>
      <Paragraph>{browser.i18n.getMessage("confirm_seed_paragraph")}</Paragraph>
      <ConfirmWords>
        {words.map((word, i) => (
          <Button
            secondary
            small
            key={i}
            onClick={() => {
              if (userOrdered.includes(word)) return;
              setUserOrdered((val) => [...val, word]);
              console.log(getCountOf(word));
            }}
          >
            {getCountOf(word) ? getCountOf(word) + ". " : ""}
            {word}
          </Button>
        ))}
      </ConfirmWords>
    </>
  );
};

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const GenerateCard = styled(Card)`
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

const Paragraph = styled(Text)`
  text-align: justify;
`;

const SeedContainer = styled.div`
  position: relative;
  padding: 0.6rem 0.8rem;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
`;

const SeedShownIcon = styled(EyeIcon)`
  position: absolute;
  right: 0.8rem;
  bottom: 0.6rem;
  font-size: 1.1rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
`;

const Seed = styled.p<{ shown: boolean }>`
  margin: 0;
  color: rgb(${(props) => props.theme.primaryText});
  font-weight: 500;
  font-size: 0.92rem;
  line-height: 1.5em;
  filter: blur(${(props) => (!props.shown ? "10px" : "0")});
`;

const CopySeed = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: max-content;
  cursor: pointer;

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
  }
`;

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

const ConfirmWords = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 0;
`;
