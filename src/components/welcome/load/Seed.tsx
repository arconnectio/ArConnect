import { FileInput, Spacer, Text, useInput } from "@arconnect/components";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { MutableRefObject, useState, useEffect } from "react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { useWalletsDetails } from "~wallets/hooks";
import { readFileString } from "~utils/file";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import SeedTextarea from "./SeedTextarea";
import styled from "styled-components";
import Wallet from "./Wallet";

export default function Seed({ seedInput, fileInputRef }: Props) {
  const [wallets, setWallets] = useState<JWKInterface[]>([]);

  // fetch added wallets
  useEffect(() => {
    (async () => {
      const files = fileInputRef?.current?.files;

      if (!files) {
        return;
      }

      const jwks: JWKInterface[] = [];

      for (const wallet of files) {
        const jwkText = await readFileString(wallet);
        const jwk = JSON.parse(jwkText);

        jwks.push(jwk);
      }

      setWallets(jwks);
    })();
  }, [fileInputRef?.current?.files]);

  const walletDetails = useWalletsDetails(wallets);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("provide_seedphrase")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("provide_seedphrase_paragraph")}
      </Paragraph>
      <SeedTextarea
        placeholder={browser.i18n.getMessage("enter_seedphrase")}
        {...(seedInput.bindings as any)}
      />
      <Spacer y={1} />
      <Or>{browser.i18n.getMessage("or").toUpperCase()}</Or>
      <Spacer y={1} />
      <FileInput
        inputRef={fileInputRef}
        multiple
        accept=".json,application/json"
      >
        {browser.i18n.getMessage("drag_and_drop_wallet")}
      </FileInput>
      {walletDetails.length > 0 && (
        <>
          <Spacer y={1.2} />
          <WalletsList>
            <AnimatePresence>
              {walletDetails.map((wallet, i) => (
                <motion.div
                  variants={opacityAnimation}
                  initial="hidden"
                  animate="shown"
                  exit="hidden"
                  key={i}
                >
                  <Wallet address={wallet.address} label={wallet.label} />
                </motion.div>
              ))}
            </AnimatePresence>
          </WalletsList>
        </>
      )}
    </>
  );
}

interface Props {
  seedInput: ReturnType<typeof useInput>;
  fileInputRef: MutableRefObject<HTMLInputElement>;
}

const Or = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;

const WalletsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
`;

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};
