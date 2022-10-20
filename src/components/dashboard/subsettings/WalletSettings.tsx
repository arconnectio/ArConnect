import {
  Button,
  Input,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  TrashIcon
} from "@iconicicons/react";
import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { IconButton } from "~components/IconButton";
import { AnsUser, getAnsProfile } from "~lib/ans";
import type { StoredWallet } from "~wallets";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";

export default function WalletSettings({ address }: Props) {
  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
    },
    []
  );

  // this wallet
  const wallet = useMemo(
    () => wallets?.find((w) => w.address === address),
    [wallets, address]
  );

  // toasts
  const { setToast } = useToasts();

  // ans
  const [ansLabel, setAnsLabel] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!wallet) return;

      // get ans profile
      const profile = (await getAnsProfile(wallet.address)) as AnsUser;

      if (!profile?.currentLabel) return;

      setAnsLabel(profile.currentLabel + ".ar");
    })();
  }, [wallet?.address]);

  // wallet name input
  const walletNameInput = useInput();

  useEffect(() => {
    if (!wallet) return;
    walletNameInput.setState(ansLabel || wallet.nickname);
  }, [wallet, ansLabel]);

  // update nickname function
  async function updateNickname() {
    if (!!ansLabel) return;

    // check name
    const newName = walletNameInput.state;

    if (!newName || newName === "") {
      return setToast({
        type: "error",
        content: "Please enter a valid nickname",
        duration: 2200
      });
    }

    // update wallets
    try {
      await setWallets((val) =>
        val.map((wallet) => {
          if (wallet.address !== address) {
            return wallet;
          }

          return {
            ...wallet,
            nickname: newName
          };
        })
      );

      setToast({
        type: "info",
        content: browser.i18n.getMessage("updated_wallet_name"),
        duration: 3000
      });
    } catch (e) {
      console.log("Could not update nickname", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_updating_wallet_name"),
        duration: 3000
      });
    }
  }

  if (!wallet) return <></>;

  return (
    <Wrapper>
      <div>
        <WalletName>{ansLabel || wallet.nickname}</WalletName>
        <WalletAddress>
          {wallet.address}
          <CopyButton
            onClick={() => {
              copy(wallet.address);
              setToast({
                type: "info",
                content: browser.i18n.getMessage("copied_address"),
                duration: 2200
              });
            }}
          />
        </WalletAddress>
        <Title>{browser.i18n.getMessage("edit_wallet_name")}</Title>
        {!!ansLabel && (
          <Warning>{browser.i18n.getMessage("cannot_edit_with_ans")}</Warning>
        )}
        <InputWithBtn>
          <InputWrapper>
            <Input
              {...walletNameInput.bindings}
              type="text"
              placeholder={browser.i18n.getMessage("edit_wallet_name")}
              fullWidth
              disabled={!!ansLabel}
            />
          </InputWrapper>
          <IconButton secondary onClick={updateNickname} disabled={!!ansLabel}>
            <CheckIcon />
          </IconButton>
        </InputWithBtn>
      </div>
      <div>
        <Button fullWidth small>
          <DownloadIcon />
          {browser.i18n.getMessage("export_keyfile")}
        </Button>
        <Spacer y={1} />
        <Button fullWidth secondary small>
          <TrashIcon />
          {browser.i18n.getMessage("remove_wallet")}
        </Button>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const WalletName = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
`;

const WalletAddress = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.37rem;
`;

const CopyButton = styled(CopyIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    transform: scale(0.87);
  }
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
`;

const Warning = styled(Text)`
  color: rgb(255, 0, 0, 0.6);
`;

interface Props {
  address: string;
}
