import { AnimatePresence, motion, Variants } from "framer-motion";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { DragEvent, useEffect, useState } from "react";
import { Card, Text } from "@arconnect/components";
import { FolderIcon } from "@iconicicons/react";
import { readFileString } from "~utils/file";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function SeedInput({
  verifyMode,
  onChange,
  onReady,
  onWalletRead,
  defaultLength = 12
}: Props) {
  // length of the seedphrase
  const [activeLength, setActiveLength] = useState<SeedLength>(defaultLength);

  // update the active length
  function updateActiveLength(length: SeedLength) {
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

  // drop effect show
  const [dropShow, setDropShow] = useState(false);

  // parse file from event data transfer
  function parseFileFromEvent(e: DragEvent<unknown>) {
    let file: File;

    // get with itemlist
    if (e.dataTransfer.items) {
      const item = e.dataTransfer.items[0];

      // check item type
      if (item.kind === "file") {
        // get file
        file = item.getAsFile();
      }
    }

    // get with filelist
    if (!file) {
      file = e.dataTransfer.files[0];
    }

    return file;
  }

  // try to trigger the wallet read event
  async function triggerWalletRead(file: File) {
    // check file type
    if (!file?.type?.includes("application/json")) return;

    // read file and convert it to json
    const fileData = JSON.parse(await readFileString(file));

    // call wallet read event
    if (onWalletRead) onWalletRead(fileData);
  }

  // to correct the drag layer
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => setDropShow(dragCounter === 1), [dragCounter]);

  return (
    <Wrapper
      dragging={dropShow}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault();
        if (verifyMode) return;
        setDragCounter((val) => val + 1);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragCounter((val) => val - 1);
      }}
      onDrop={(e) => {
        // prevent default open behavior
        e.preventDefault();

        if (verifyMode) return;

        if (dropShow) {
          setDragCounter(0);
        }

        // get file
        const file = parseFileFromEvent(e);

        // trigger event
        triggerWalletRead(file);
      }}
    >
      <AnimatePresence>
        {dropShow && (
          <DragLayer>
            <FolderIcon />
            {browser.i18n.getMessage("dragAndDropFile")}
          </DragLayer>
        )}
      </AnimatePresence>
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
        <HeadButton
          disabled={verifyMode}
          onClick={() => {
            if (verifyMode) return;

            // create fake input
            const input = document.createElement("input");

            input.type = "file";
            input.accept = ".json,application/json";
            input.click();

            // on file selected
            input.addEventListener("change", (e: Event) => {
              // get file
              const file = (e.target as HTMLInputElement).files[0];

              // trigger event
              triggerWalletRead(file);

              // remove input
              input.remove();
            });
          }}
        >
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
                if (i === activeLength - 1) {
                  if (onReady) onReady();
                  return;
                }

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

const Wrapper = styled(Card)<{ dragging?: boolean }>`
  position: relative;
  padding: 0;
  border-style: ${(props) => (props.dragging ? "dashed" : "solid")};
  overflow: hidden;
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

const dragLayerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

const DragLayer = styled(motion.div).attrs({
  initial: "hidden",
  animate: "show",
  exit: "hidden",
  variants: dragLayerVariants
})`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: rgba(${(props) => props.theme.theme}, 0.2);
  color: rgb(${(props) => props.theme.theme});
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  gap: 0.2rem;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(3px);

  svg {
    font-size: 4rem;
    width: 1em;
    height: 1em;
  }
`;

interface Props {
  /**
   * Verify mode is to verify that the
   * user wrote down their seedphrase.
   */
  verifyMode?: boolean;
  onChange?: (val: string) => void;
  /**
   * Enter key press on the last word's
   * input.
   */
  onReady?: () => void;
  defaultLength?: SeedLength;
  onWalletRead?: (wallet: JWKInterface) => void;
}

type SeedLength = 12 | 24;
