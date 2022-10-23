import {
  Button,
  Card,
  Checkbox,
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
import { sendMessage } from "@arconnect/webext-bridge";
import { formatAddress } from "~utils/format";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import styled from "styled-components";
import copy from "copy-to-clipboard";

export default function Generate() {
  // active page
  const [page, setPage] = useState(1);

  // wallet seed
  const [seed, setSeed] = useState("");

  // load seed
  useEffect(() => {
    (async () => {
      console.log(bip39);
      const mnemonic = await bip39.generateMnemonic();

      setSeed(mnemonic);
    })();
  }, []);

  // toasts
  const { setToast } = useToasts();

  // send wallet generating request
  const [sendGenerationRequest, setSendGenerationRequest] = useState(false);

  // wallet generator
  // we send a message to the background worker
  // to create the wallet
  // this is needed because wallet generationg is very
  // slow, so it is better to perform it in the background
  //
  // IMPORTANT: because a stored wallet keyfile can be undefined,
  // as it has not yet generated it's keyfile, we need to display
  // in the popup, if a wallet is still being generated, and will
  // be pushed to the stored wallets array
  useEffect(() => {
    (async () => {
      if (seed === "" || sendGenerationRequest) return;
      setSendGenerationRequest(true);

      try {
        // try to generate wallet in the background
        const res = await sendMessage("generate_wallet", { seed });

        setToast({
          type: "success",
          content: browser.i18n.getMessage("generated_wallet", [
            formatAddress(res.address, 6)
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
    })();
  }, [seed, sendGenerationRequest]);

  // written down checkbox
  const writtenDown = useCheckbox();

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
        <Spacer y={1.25} />
        <Checkbox {...writtenDown.bindings}>
          {browser.i18n.getMessage("written_down_seed")}
        </Checkbox>
        <Spacer y={1.25} />
        <Button
          fullWidth
          disabled={!writtenDown.state}
          onClick={() => {
            if (!writtenDown.state) return;
            if (page !== 3) setPage((v) => v + 1);
            else window.top.close();
          }}
        >
          {browser.i18n.getMessage(page === 3 ? "done" : "next")}
          {page !== 3 && <ArrowRightIcon />}
        </Button>
      </GenerateCard>
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
