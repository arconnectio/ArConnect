import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Button, Text, useToasts } from "@arconnect/components";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function ConfirmSeedPage({ seed, setSorted }: Props) {
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
}

const ConfirmWords = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 0;
`;

interface Props {
  seed: string;
  setSorted: Dispatch<SetStateAction<boolean>>;
}
