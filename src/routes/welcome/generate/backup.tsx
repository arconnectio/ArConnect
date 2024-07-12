import { ButtonV2, Spacer, Text } from "@arconnect/components";
import { useLocation, useRoute } from "wouter";
import { useContext, useEffect, useRef, useState } from "react";
import { WalletContext } from "../setup";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import {
  ArrowRightIcon,
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon
} from "@iconicicons/react";
import { PageType, trackPage } from "~utils/analytics";

export default function Backup() {
  // seed blur status
  const [shown, setShown] = useState(false);

  // wallet context
  const { wallet: generatedWallet } = useContext(WalletContext);

  // ref to track the latest generated wallet
  const walletRef = useRef(generatedWallet);

  // route
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");
  const [, setLocation] = useLocation();

  // icon displayed for "copy seedphrase"
  const [copyDisplay, setCopyDisplay] = useState(true);

  // copy the seedphrase
  function copySeed() {
    copy(generatedWallet.mnemonic || "");
    setCopyDisplay(false);
    setTimeout(() => setCopyDisplay(true), 1050);
  }

  useEffect(() => {
    walletRef.current = generatedWallet;
  }, [generatedWallet]);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_BACKUP);
  }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("backup_wallet_title")}</Text>
      <Paragraph>{browser.i18n.getMessage("backup_wallet_content")}</Paragraph>
      <SeedContainer onClick={() => setShown((val) => !val)}>
        <Seed shown={shown}>{generatedWallet.mnemonic || ""}</Seed>
        <SeedShownIcon as={shown ? EyeIcon : EyeOffIcon} />
      </SeedContainer>
      <Spacer y={0.5} />
      <CopySeed onClick={copySeed}>
        {(copyDisplay && <CopyIcon />) || <CheckIcon />}
        {browser.i18n.getMessage("copySeed")}
      </CopySeed>
      <Spacer y={1} />
      <ButtonV2
        fullWidth
        onClick={() =>
          setLocation(`/${params.setup}/${Number(params.page) + 1}`)
        }
      >
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon />
      </ButtonV2>
    </>
  );
}

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
