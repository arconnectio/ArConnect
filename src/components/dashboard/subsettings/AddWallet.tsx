import { PlusIcon, SettingsIcon } from "@iconicicons/react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { jwkFromMnemonic } from "~wallets/generator";
import { checkPassword } from "~wallets/auth";
import { useLocation } from "wouter";
import { addWallet } from "~wallets";
import { useState } from "react";
import {
  Button,
  FileInput,
  Input,
  Text,
  useInput,
  Spacer,
  useToasts
} from "@arconnect/components";
import BackupWalletPage from "~components/welcome/generate/BackupWalletPage";
import KeystoneButton from "~components/hardware/KeystoneButton";
import SeedTextarea from "~components/welcome/load/SeedTextarea";
import SeedInput from "~components/SeedInput";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import Arweave from "arweave/web/common";
import styled from "styled-components";

export default function AddWallet() {
  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // loading
  const [loading, setLoading] = useState(false);

  // seedphrase or jwk loaded from
  // the seedphrase component
  const [providedWallet, setProvidedWallet] = useState<JWKInterface | string>();

  // router location
  const [, setLocation] = useLocation();

  // add wallet
  async function loadWallet() {
    if (!providedWallet) return;
    setLoading(true);

    // prevent user from closing the window
    // while ArConnect is loading the wallet
    window.onbeforeunload = () =>
      browser.i18n.getMessage("close_tab_load_wallet_message");

    try {
      // load jwk from seedphrase input state
      const jwk =
        typeof providedWallet === "string"
          ? await jwkFromMnemonic(providedWallet)
          : providedWallet;

      await addWallet(jwk, passwordInput.state);

      // send success toast
      setToast({
        type: "success",
        content: browser.i18n.getMessage("added_wallet"),
        duration: 2300
      });

      // redirect to the wallet in settings
      const arweave = new Arweave(defaultGateway);

      setLocation(`/wallets/${await arweave.wallets.jwkToAddress(jwk)}`);
    } catch (e) {
      console.log("Failed to load wallet", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_adding_wallet"),
        duration: 2000
      });
    }

    // reset before unload
    window.onbeforeunload = null;
    setLoading(false);
  }

  // generated seedphrase
  const [generatedSeed, setGeneratedSeed] = useState<string>();

  // generating status
  const [generating, setGenerating] = useState(false);

  // generate new wallet
  async function generateWallet() {
    if (!!generatedSeed) return;

    if (passwordInput.state === "") {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("enter_pw_gen_wallet"),
        duration: 2200
      });
    }

    if (!(await checkPassword(passwordInput.state))) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }

    setGenerating(true);

    try {
      // generate seed
      const mnemonic = await bip39.generateMnemonic();

      setGeneratedSeed(mnemonic);

      // generate from mnemonic
      const wallet = await jwkFromMnemonic(mnemonic);

      // add wallet
      await addWallet(wallet, passwordInput.state);

      setToast({
        type: "success",
        content: browser.i18n.getMessage("generated_wallet_dashboard"),
        duration: 2200
      });
    } catch (e) {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_generating_wallet"),
        duration: 2200
      });
    }

    setGenerating(false);
  }

  return (
    <Wrapper>
      <div>
        <Title>{browser.i18n.getMessage("add_wallet")}</Title>
        <Text>{browser.i18n.getMessage("provide_seedphrase_paragraph")}</Text>
        <SeedInput
          onChange={(val) => setProvidedWallet(val)}
          onReady={loadWallet}
        />
        <Spacer y={1} />
        <Input
          type="password"
          {...passwordInput.bindings}
          placeholder={browser.i18n.getMessage("enter_password")}
          label={browser.i18n.getMessage("password")}
          fullWidth
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            loadWallet();
          }}
        />
        <Spacer y={1} />
        <Button fullWidth onClick={loadWallet} loading={loading}>
          <PlusIcon />
          {browser.i18n.getMessage("add_wallet")}
        </Button>
        <Spacer y={1.3} />
        <Or>{browser.i18n.getMessage("or").toUpperCase()}</Or>
        <Spacer y={1.3} />
        <KeystoneButton />
        <Spacer y={1} />
        <Button
          fullWidth
          secondary
          onClick={generateWallet}
          loading={generating}
          disabled={!!generatedSeed}
        >
          <SettingsIcon />
          {browser.i18n.getMessage("generate_wallet")}
        </Button>
        {/*(
          <>
            <BackupWalletPage seed={generatedSeed} />
            <Spacer y={1} />
            {generating && (
              <Text noMargin>
                {browser.i18n.getMessage("generating_wallet")}{" "}
                {browser.i18n.getMessage("no_close_window")}
              </Text>
            )}
          </>
            )*/}
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%;
  gap: 1rem;
`;

const Title = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
`;

const WalletInput = styled(FileInput)`
  padding-top: 2.6rem;
  padding-bottom: 2.6rem;
`;

const Or = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;

const ShortSeedTextarea = styled(SeedTextarea)`
  height: 110px;
`;

const Btns = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${Button} {
    width: 49%;
  }
`;
