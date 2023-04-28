import { useContext, useEffect, useMemo, useState } from "react";
import { Button, Text, useToasts } from "@arconnect/components";
import { useLocation, useRoute } from "wouter";
import { WalletContext } from "../setup";
import SeedphraseInput from "~components/SeedphraseInput";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Confirm() {
  // wallet context
  const generatedWallet = useContext(WalletContext);

  // confirm words
  const [confirmWords, setConfirmWords] = useState<string[]>([]);

  // toasts
  const { setToast } = useToasts();

  // mnemonic words
  const words = useMemo(
    () => generatedWallet.mnemonic?.split(" ") || [],
    [generatedWallet]
  );
  const randomWords = useMemo(
    () => [...words].sort((a, b) => 0.5 - Math.random()),
    [words]
  );

  // route
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");
  const [, setLocation] = useLocation();

  // check first and last words
  useEffect(() => {
    if (confirmWords.length < 2) return;

    // validate words
    if (
      confirmWords[0] === words[0] &&
      confirmWords[1] === words[words.length - 1]
    ) {
      setLocation(`/${params.setup}/${Number(params.page) + 1}`);
    } else {
      // reset confirm words
      setConfirmWords([]);

      // send error
      setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_seed"),
        duration: 2200
      });
    }
  }, [confirmWords]);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("confirm_seed")}</Text>
      <Paragraph>{browser.i18n.getMessage("confirm_seed_paragraph")}</Paragraph>
      <SeedphraseInput verifyMode />
      <ConfirmWords>
        {randomWords.map((word, i) => (
          <Word
            key={i}
            onClick={() =>
              setConfirmWords((val) => {
                if (val.length >= 2) return val;

                return [...val, word];
              })
            }
            secondary={!confirmWords.includes(word)}
          >
            {word}
          </Word>
        ))}
      </ConfirmWords>
    </>
  );
}

const ConfirmWords = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
`;

const Word = styled(Button).attrs({
  small: true
})`
  padding-left: 0;
  padding-right: 0;
`;
