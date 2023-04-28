import { Button, Spacer, Text, useToasts } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useLocation, useRoute } from "wouter";
import { useContext, useState } from "react";
import { WalletContext } from "../setup";
import SeedInput from "~components/SeedInput";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

export default function Confirm() {
  // wallet context
  const generatedWallet = useContext(WalletContext);

  // toasts
  const { setToast } = useToasts();

  // confirm seedphrase input state
  const [seedInputState, setSeedInputState] = useState<string>("");

  // route
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");
  const [, setLocation] = useLocation();

  // validate entered seedphrase
  function validateSeedphrase() {
    // check if the entered seedphrase is
    // the same as the one generated before
    if (seedInputState !== generatedWallet.mnemonic) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_seed"),
        duration: 2200
      });
    }

    // continue
    setLocation(`/${params.setup}/${Number(params.page) + 1}`);
  }

  return (
    <>
      <Text heading>{browser.i18n.getMessage("confirm_seed")}</Text>
      <Paragraph>{browser.i18n.getMessage("confirm_seed_paragraph")}</Paragraph>
      <SeedInput verifyMode onChange={(val) => setSeedInputState(val)} />
      <Spacer y={1.5} />
      <Button fullWidth onClick={validateSeedphrase}>
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon />
      </Button>
    </>
  );
}
