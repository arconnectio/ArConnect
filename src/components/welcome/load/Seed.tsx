import { FileInput, Spacer, Text, useInput } from "@arconnect/components";
import type { MutableRefObject } from "react";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import SeedTextarea from "./SeedTextarea";
import styled from "styled-components";

export default function Seed({ seedInput, fileInputRef }: Props) {
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
