import { isValidMnemonic, jwkFromMnemonic } from "~wallets/generator";
import { PlusIcon, SettingsIcon } from "@iconicicons/react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { checkPassword } from "~wallets/auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { addWallet } from "~wallets";
import {
  Text,
  useInput,
  Spacer,
  useToasts,
  ButtonV2,
  InputV2
} from "@arconnect/components";
import BackupWalletPage from "~components/welcome/generate/BackupWalletPage";
import KeystoneButton from "~components/hardware/KeystoneButton";
import SeedInput from "~components/SeedInput";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import Arweave from "arweave/web/common";
import styled from "styled-components";
import { defaultGateway } from "~gateways/gateway";

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

    const finishUp = () => {
      // reset before unload
      window.onbeforeunload = null;
      setLoading(false);
    };

    // validate mnemonic
    if (typeof providedWallet === "string") {
      try {
        isValidMnemonic(providedWallet);
      } catch (e) {
        console.log("Invalid mnemonic provided", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalid_mnemonic"),
          duration: 2000
        });
        finishUp();
      }
    }

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

    finishUp();
  }

  // generating status
  const [generating, setGenerating] = useState(false);

  // generated wallet
  const [generatedWallet, setGeneratedWallet] = useState<{
    jwk?: JWKInterface;
    seedphrase: string;
  }>();

  // start generating a wallet when
  // the component is mounted so the
  // user doesn't have to wait for it
  // in case they want to create a new
  // wallet
  useEffect(() => {
    generateWallet();
  }, []);

  // generate new wallet
  async function generateWallet() {
    setGenerating(true);

    // generate a seedphrase
    const seedphrase = await bip39.generateMnemonic();

    setGeneratedWallet({ seedphrase });

    // generate from seedphrase
    const jwk = await jwkFromMnemonic(seedphrase);

    setGeneratedWallet((val) => ({ ...val, jwk }));
    setGenerating(false);

    return { jwk, seedphrase };
  }

  // add the wallet on generation or no
  const [isAddGeneratedWallet, setIsAddGeneratedWallet] = useState(false);

  // remove tab close warning when generated
  useEffect(() => {
    if (generating || !isAddGeneratedWallet) return;
    window.onbeforeunload = null;
  }, [isAddGeneratedWallet, generating]);

  // add the generated wallet to ArConnect
  async function addGeneratedWallet() {
    // check if jwk was properly generated from seedphrase
    if (!generatedWallet?.jwk) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("error_generating_wallet"),
        duration: 2200
      });
    }

    // check the password
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

    try {
      // add the wallet
      await addWallet(generatedWallet.jwk, passwordInput.state);

      // indicate success
      setToast({
        type: "success",
        content: browser.i18n.getMessage("generated_wallet_dashboard"),
        duration: 2200
      });

      // redirect to the wallet in settings
      const arweave = new Arweave(defaultGateway);

      setLocation(
        `/wallets/${await arweave.wallets.jwkToAddress(generatedWallet.jwk)}`
      );
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_generating_wallet"),
        duration: 2200
      });
    }
  }

  // handle add wallet button press
  // and add check before the action
  function handleAddButton() {
    if (generating && isAddGeneratedWallet) return;
    if (!isAddGeneratedWallet) loadWallet();
    else addGeneratedWallet();
  }

  return (
    <Wrapper>
      <div>
        {(!generating &&
          isAddGeneratedWallet &&
          generatedWallet?.seedphrase && (
            <BackupWalletPage seed={generatedWallet.seedphrase} />
          )) || (
          <>
            <Spacer y={0.45} />
            <Title>{browser.i18n.getMessage("add_wallet")}</Title>
            <Text>
              {browser.i18n.getMessage("provide_seedphrase_paragraph")}
            </Text>
            <SeedInput onChange={(val) => setProvidedWallet(val)} />
          </>
        )}
        <Spacer y={1} />
        <InputV2
          type="password"
          {...passwordInput.bindings}
          placeholder={browser.i18n.getMessage("enter_password")}
          label={browser.i18n.getMessage("password")}
          fullWidth
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            handleAddButton();
          }}
        />
        <Spacer y={1} />
        <ButtonV2
          fullWidth
          onClick={handleAddButton}
          disabled={generating && isAddGeneratedWallet}
        >
          <PlusIcon />
          {browser.i18n.getMessage("add_wallet")}
        </ButtonV2>
        <Spacer y={1.3} />
        <Or>{browser.i18n.getMessage("or").toUpperCase()}</Or>
        <Spacer y={1.3} />
        <KeystoneButton />
        <Spacer y={1} />
        <ButtonV2
          fullWidth
          secondary
          onClick={() => {
            if (!generating && isAddGeneratedWallet) return;

            // signal that the generated wallet should be added
            setIsAddGeneratedWallet(true);

            // warn the user about closing the window
            window.onbeforeunload = () =>
              browser.i18n.getMessage("close_tab_generate_wallet_message");
          }}
          loading={generating && isAddGeneratedWallet}
          disabled={!generating && isAddGeneratedWallet}
        >
          <SettingsIcon />
          {browser.i18n.getMessage("generate_wallet")}
        </ButtonV2>
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

const Or = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
