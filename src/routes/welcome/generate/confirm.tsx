import { Button, Spacer, Text, useToasts } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useLocation, useRoute } from "wouter";
import { useContext, useEffect, useState } from "react";
import { WalletContext } from "../setup";
import SeedInput from "~components/SeedInput";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import { PageType, trackPage } from "~utils/analytics";

export default function Confirm() {
  // wallet context
  const generatedWallet = useContext(WalletContext);

  // toasts
  const { setToast } = useToasts();

  // confirm seedphrase input state
  const [seedInputState, setSeedInputState] = useState<string>();

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

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_SEEDPHRASE);
  }, []);

  // pre filled words
  const [preFill, setPreFill] = useState<string[]>();

  useEffect(() => {
    if (!generatedWallet.mnemonic) return;
    const toPreFill: {
      i: number;
      val: string;
    }[] = [];
    const words = generatedWallet.mnemonic.split(" ");
    const qtyToGenerate = words.length / 2;

    while (toPreFill.length < qtyToGenerate) {
      const index = Math.floor(Math.random() * words.length);

      if (toPreFill.find((v) => v.i === index)) continue;
      toPreFill.push({
        i: index,
        val: words[index]
      });
    }

    setPreFill(() => {
      const baseArray: string[] = new Array(words.length).fill(undefined);

      for (const el of toPreFill) baseArray[el.i] = el.val;

      return baseArray;
    });
  }, [generatedWallet]);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("confirm_seed")}</Text>
      <Paragraph>{browser.i18n.getMessage("confirm_seed_paragraph")}</Paragraph>
      <SeedInput
        verifyMode
        onChange={(val) => {
          if (typeof val !== "string") return;
          setSeedInputState(val);
        }}
        showHead={false}
        onReady={validateSeedphrase}
        preFill={preFill}
      />
      <Spacer y={1.5} />
      <Button fullWidth onClick={validateSeedphrase}>
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon />
      </Button>
    </>
  );
}
