import { Card, Text } from "@arconnect/components";
import { FolderIcon } from "@iconicicons/react";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function SeedInput({ verifyMode, onChange }: Props) {
  // length of the seedphrase
  const [activeLength, setActiveLength] = useState<12 | 24>(12);

  // update the active length
  function updateActiveLength(length: 12 | 24) {
    if (verifyMode) return;
    setActiveLength(length);
  }

  // words
  const [words, setWords] = useState<string[]>(Array(24).fill(""));

  // onchange event
  useEffect(() => {
    if (!onChange) return;
    onChange(words.slice(0, activeLength).join(" "));
  }, [words, onChange]);

  return (
    <Wrapper>
      <Head>
        <LengthSelector>
          <LengthButton
            active={activeLength === 12}
            onClick={() => updateActiveLength(12)}
            disabled={verifyMode}
          >
            12
          </LengthButton>
          <LengthButton
            active={activeLength === 24}
            onClick={() => updateActiveLength(24)}
            disabled={verifyMode}
          >
            24
          </LengthButton>
        </LengthSelector>
        <HeadButton disabled={verifyMode}>
          <FolderIcon />
          {browser.i18n.getMessage("keyfile")}
        </HeadButton>
      </Head>
      <WordsWrapper>
        {words.slice(0, activeLength).map((word, i) => (
          <WordInputWrapper key={i}>
            <Text noMargin>{i + 1}</Text>
            <WordInput
              onPaste={(e) => {
                // return if verify mode is enabled
                // we don't want the user to paste in
                // their entire seedphrase
                if (verifyMode) return e.preventDefault();

                // get pasted words
                const pastedWords = e.clipboardData.getData("Text").split(" ");

                // check length
                if (pastedWords.length <= 1) return;

                // update words
                for (let j = i; j < pastedWords.length + i; j++) {
                  if (j > activeLength) break;

                  words[j] = pastedWords[j - i];
                }

                // update state
                setWords([...words]);

                // prevent default paste
                e.preventDefault();
              }}
              value={word}
              onChange={(e) => {
                words[i] = e.target.value;

                setWords([...words]);
              }}
              onKeyDown={(e) => {
                // check key code
                if (e.key !== " " && e.key !== "Enter") return;

                // prevent default action
                e.preventDefault();

                // don't progress for the last input
                // in the seedphrase
                if (i === activeLength - 1) return;

                // trick to move to the next input
                const inputs = document.getElementsByTagName("input");

                let currentInputIndex = 0;

                // find the current input's index
                while (inputs[currentInputIndex] !== e.target) {
                  currentInputIndex++;
                }

                // progress to the next input
                inputs[currentInputIndex + 1].focus();
              }}
            />
          </WordInputWrapper>
        ))}
      </WordsWrapper>
    </Wrapper>
  );
}

const Wrapper = styled(Card)`
  padding: 0;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(${(props) => props.theme.cardBorder});
  padding: 0.4rem 0.8rem;
`;

const LengthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const HeadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(${(props) => props.theme.theme}, 1);
  cursor: pointer;
  background-color: transparent;
  border: none;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: rgba(${(props) => props.theme.theme}, 0.2);
  }

  svg {
    font-size: 1.3em;
    width: 1em;
    height: 1em;
  }

  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
`;

const LengthButton = styled(HeadButton)<{ active?: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  color: rgba(
    ${(props) => props.theme.theme},
    ${(props) => (props.active ? "1" : ".46")}
  );
  padding: 0;

  &:hover {
    background-color: transparent !important;
  }
`;

const WordsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem 0.9rem;
  padding: 1rem 0.8rem;
`;

const WordInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.05rem;
  padding: 0 0.1rem;
  border-bottom: 2px solid rgb(${(props) => props.theme.cardBorder});
  transition: all 0.23s ease-in-out;

  &:focus-within {
    border-bottom-color: rgb(${(props) => props.theme.theme});
  }
`;

const WordInput = styled.input.attrs({
  type: "text"
})`
  background-color: transparent;
  border: none;
  padding: 0.15rem 0.25rem;
  font-size: 1rem;
  outline: none;
  width: 100%;
  color: rgb(${(props) => props.theme.theme});
  font-weight: 500;
`;

interface Props {
  /**
   * Verify mode is to verify that the
   * user wrote down their seedphrase.
   */
  verifyMode?: boolean;
  onChange?: (val: string) => void;
}
