import { PlusIcon, SettingsIcon } from "@iconicicons/react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { jwkFromMnemonic } from "~wallets/generator";
import { checkPassword } from "~wallets/auth";
import { readFileString } from "~utils/file";
import { useRef, useState } from "react";
import { addWallet } from "~wallets";
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
import SeedTextarea from "~components/welcome/load/SeedTextarea";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import styled from "styled-components";
import KeystoneButton from "~components/KeystoneButton";

export default function AddWallet() {
  // file input ref
  const fileInput = useRef<HTMLInputElement>();

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // loading
  const [loading, setLoading] = useState(false);

  // add wallets
  async function addWallets() {
    const files = fileInput?.current?.files;
    const walletsToAdd: JWKInterface[] = [];

    if (!files && seedInput.state === "") return;

    setLoading(true);

    try {
      // load from files
      if (files) {
        for (const wallet of files) {
          const jwkText = await readFileString(wallet);
          const jwk = JSON.parse(jwkText);

          walletsToAdd.push(jwk);
        }
      }

      // load from menmonic
      if (seedInput.state !== "") {
        walletsToAdd.push(await jwkFromMnemonic(seedInput.state));
      }

      await addWallet(walletsToAdd, passwordInput.state);

      setToast({
        type: "success",
        content: browser.i18n.getMessage("added_wallets"),
        duration: 2300
      });
    } catch (e) {
      console.log("Error adding wallet(s)", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_adding_wallets"),
        duration: 2000
      });
    }

    passwordInput.setState("");
    seedInput.setState("");
    setLoading(false);
  }

  // seedphrase input
  const seedInput = useInput();

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
        <Title>{browser.i18n.getMessage("addWallet")}</Title>
        <Text>{browser.i18n.getMessage("add_wallet_subtitle")}</Text>
        {(!generatedSeed && (
          <>
            <WalletInput
              inputRef={fileInput}
              multiple
              accept=".json,application/json"
            >
              {browser.i18n.getMessage("drag_and_drop_wallet")}
            </WalletInput>
            <Spacer y={1} />
            <Or>{browser.i18n.getMessage("or").toUpperCase()}</Or>
            <Spacer y={1} />
            <ShortSeedTextarea
              {...(seedInput.bindings as any)}
              placeholder={browser.i18n.getMessage("enter_seedphrase")}
            />
            <Spacer y={1} />
            <Input
              type="password"
              {...passwordInput.bindings}
              placeholder={browser.i18n.getMessage("enter_password")}
              label={browser.i18n.getMessage("password")}
              fullWidth
            />
          </>
        )) || (
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
        )}
      </div>
      <div>
        {!generatedSeed && (
          <>
            <Button fullWidth onClick={addWallets} loading={loading}>
              <PlusIcon />
              {browser.i18n.getMessage("addWallet")}
            </Button>
            <Spacer y={2} />
          </>
        )}
        <Btns>
          <KeystoneButton />
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
        </Btns>
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
