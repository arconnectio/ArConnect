import {
  Button,
  FileInput,
  Input,
  Text,
  useInput,
  Spacer,
  useToasts
} from "@arconnect/components";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { PlusIcon } from "@iconicicons/react";
import { readFileString } from "~utils/file";
import { addWallet } from "~wallets";
import { useRef } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function AddWallet() {
  // file input ref
  const fileInput = useRef<HTMLInputElement>();

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // add wallets
  async function addWallets() {
    const files = fileInput?.current?.files;
    const walletsToAdd: JWKInterface[] = [];

    if (!files) return;

    try {
      for (const wallet of files) {
        const jwkText = await readFileString(wallet);
        const jwk = JSON.parse(jwkText);

        walletsToAdd.push(jwk);
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
  }

  return (
    <Wrapper>
      <div>
        <Title>{browser.i18n.getMessage("addWallet")}</Title>
        <Text>{browser.i18n.getMessage("add_wallet_subtitle")}</Text>
        <WalletInput
          inputRef={fileInput}
          multiple
          accept=".json,application/json"
        >
          {browser.i18n.getMessage("drag_and_drop_wallet")}
        </WalletInput>
        <Spacer y={1} />
        <Input
          type="password"
          {...passwordInput.bindings}
          placeholder={browser.i18n.getMessage("enter_password")}
          label={browser.i18n.getMessage("password")}
          fullWidth
        />
      </div>
      <Button fullWidth onClick={addWallets}>
        <PlusIcon />
        {browser.i18n.getMessage("addWallet")}
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Title = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
`;

const WalletInput = styled(FileInput)`
  padding-top: 3rem;
  padding-bottom: 3rem;
`;
