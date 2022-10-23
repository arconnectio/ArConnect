import { Text, useInput } from "@arconnect/components";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import SeedTextarea from "./SeedTextarea";

export default function Seed({ seedInput }: Props) {
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
    </>
  );
}

interface Props {
  seedInput: ReturnType<typeof useInput>;
}
