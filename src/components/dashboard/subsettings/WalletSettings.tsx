import {
  Button,
  Input,
  Modal,
  ModalButton,
  Spacer,
  Text,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  TrashIcon
} from "@iconicicons/react";
import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { removeWallet, StoredWallet } from "~wallets";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { IconButton } from "~components/IconButton";
import { decryptWallet } from "~wallets/encryption";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { downloadFile } from "~utils/file";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { checkPassword } from "~wallets/auth";

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

  // wallet remove modal
  const removeModal = useModal();

  // export wallet modal
  const exportModal = useModal();

  // password input
  const passwordInput = useInput();

  // export the wallet
  async function exportWallet() {
    try {
      // decrypt keyfile
      const decrypted = await decryptWallet(
        wallet.keyfile,
        passwordInput.state
      );

      // download the file
      downloadFile(
        JSON.stringify(decrypted, null, 2),
        "application/json",
        `arweave-keyfile-${address}.json`
      );

      // close modal
      exportModal.setOpen(false);
    } catch (e) {
      console.log("Error exporting wallet", e.message);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("export_wallet_error"),
        duration: 2200
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
        <Button fullWidth small onClick={() => exportModal.setOpen(true)}>
          <DownloadIcon />
          {browser.i18n.getMessage("export_keyfile")}
        </Button>
        <Spacer y={1} />
        <Button
          fullWidth
          secondary
          small
          onClick={() => removeModal.setOpen(true)}
        >
          <TrashIcon />
          {browser.i18n.getMessage("remove_wallet")}
        </Button>
      </div>
      <Modal {...removeModal.bindings}>
        <CenterText heading>
          {browser.i18n.getMessage("remove_wallet_modal_title")}
        </CenterText>
        <CenterText>
          {browser.i18n.getMessage("remove_wallet_modal_content")}
        </CenterText>
        <Spacer y={1.75} />
        <Button
          fullWidth
          onClick={async () => {
            try {
              await removeWallet(address);
              setToast({
                type: "success",
                content: browser.i18n.getMessage("removed_wallet_notification"),
                duration: 2000
              });
            } catch (e) {
              console.log("Error removing wallet", e);
              setToast({
                type: "error",
                content: browser.i18n.getMessage(
                  "remove_wallet_error_notification"
                ),
                duration: 2000
              });
            }
          }}
        >
          {browser.i18n.getMessage("confirm")}
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={() => removeModal.setOpen(false)}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Modal>
      <Modal {...exportModal.bindings}>
        <CenterText heading>
          {browser.i18n.getMessage("export_wallet_modal_title")}
        </CenterText>
        <Input
          type="password"
          placeholder={browser.i18n.getMessage("password")}
          {...passwordInput.bindings}
          fullWidth
        />
        <Spacer y={1.75} />
        <Button fullWidth onClick={exportWallet}>
          {browser.i18n.getMessage("export")}
        </Button>
      </Modal>
    </Wrapper>
  );
}

const CenterText = styled(Text)`
  text-align: center;
`;

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
