import { Card, Text } from "@arconnect/components";
import { FolderIcon } from "@iconicicons/react";
import { useState } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function SeedphraseInput({ verifyMode }: Props) {
  // length of the seedphrase
  const [activeLength, setActiveLength] = useState<12 | 24>(12);

  // update the active length
  function updateActiveLength(length: 12 | 24) {
    if (verifyMode) return;
    setActiveLength(length);
  }

  // words
  const [words, setWords] = useState<string[]>(Array(24).fill(""));

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
        {new Array(activeLength).fill("").map((_, i) => (
          <WordInputWrapper key={i}>
            <Text noMargin>{i + 1}</Text>
            <WordInput
              onPaste={(e) => {
                // get pasted words
                const pastedWords = e.clipboardData.getData("Text").split(" ");

                // check length
                if (pastedWords.length <= 1) return;

                // update words
                setWords((val) => {
                  for (let j = i; j < pastedWords.length + i; j++) {
                    if (j > activeLength) break;

                    val[j] = pastedWords[j - i];
                  }

                  return val;
                });

                // prevent default paste
                e.preventDefault();
              }}
              value={words[i]}
              onChange={(e) =>
                setWords((val) => {
                  // update one word
                  val[i] = e.target.value;

                  return val;
                })
              }
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
}
