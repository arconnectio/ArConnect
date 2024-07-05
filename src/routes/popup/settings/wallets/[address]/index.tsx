import {
  ButtonV2,
  InputV2,
  ModalV2,
  Spacer,
  Text,
  TooltipV2,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components";
import { QrCode02 } from "@untitled-ui/icons-react";
import { CopyIcon, DownloadIcon, TrashIcon } from "@iconicicons/react";
import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { removeWallet, type StoredWallet } from "~wallets";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { IconButton } from "~components/IconButton";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { ExtensionStorage } from "~utils/storage";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { formatAddress } from "~utils/format";
import HeadV2 from "~components/popup/HeadV2";
import { useLocation } from "wouter";

export default function Wallet({ address }: Props) {
  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
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

  // location
  const [, setLocation] = useLocation();

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

  if (!wallet) return <></>;

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("edit_wallet")}
        back={() => setLocation("/quick-settings/wallets")}
      />
      <Wrapper>
        <div>
          <div>
            <WalletName>
              {ansLabel || wallet.nickname}
              {wallet.type === "hardware" && (
                <TooltipV2
                  content={
                    wallet.api.slice(0, 1).toUpperCase() + wallet.api.slice(1)
                  }
                  position="bottom"
                >
                  <HardwareWalletIcon
                    src={wallet.api === "keystone" ? keystoneLogo : undefined}
                  />
                </TooltipV2>
              )}
            </WalletName>
            <WalletAddress>
              {formatAddress(wallet.address, 8)}
              <TooltipV2
                content={browser.i18n.getMessage("copy_address")}
                position="bottom"
              >
                <CopyButton
                  onClick={() => {
                    copy(wallet.address);
                    setToast({
                      type: "info",
                      content: browser.i18n.getMessage("copied_address", [
                        wallet.nickname,
                        formatAddress(wallet.address, 3)
                      ]),
                      duration: 2200
                    });
                  }}
                />
              </TooltipV2>
            </WalletAddress>
          </div>

          <Title>{browser.i18n.getMessage("edit_wallet_name")}</Title>
          {!!ansLabel && (
            <Warning>{browser.i18n.getMessage("cannot_edit_with_ans")}</Warning>
          )}
          <InputWithBtn>
            <InputWrapper>
              <InputV2
                small
                {...walletNameInput.bindings}
                type="text"
                placeholder={browser.i18n.getMessage("edit_wallet_name")}
                fullWidth
                disabled={!!ansLabel}
              />
            </InputWrapper>
            <IconButton
              style={{ height: "2.625rem" }}
              onClick={updateNickname}
              disabled={!!ansLabel}
            >
              Save
            </IconButton>
          </InputWithBtn>
        </div>
        <div>
          <ButtonV2
            fullWidth
            onClick={() => setLocation(`/quick-settings/wallets/${address}/qr`)}
          >
            {browser.i18n.getMessage("generate_qr_code")}
            <QrCode02 style={{ marginLeft: "2px" }} />
          </ButtonV2>
          <Spacer y={0.625} />
          <ButtonV2
            fullWidth
            secondary
            onClick={() =>
              setLocation(`/quick-settings/wallets/${address}/export`)
            }
            disabled={wallet.type === "hardware"}
          >
            {browser.i18n.getMessage("export_keyfile")}
            <DownloadIcon style={{ marginLeft: "2px" }} />
          </ButtonV2>
          <Spacer y={0.625} />
          <ButtonV2
            fullWidth
            style={{ backgroundColor: "#8C1A1A" }}
            onClick={() => removeModal.setOpen(true)}
          >
            {browser.i18n.getMessage("remove_wallet")}
            <TrashIcon style={{ marginLeft: "2px" }} />
          </ButtonV2>
        </div>
        <ModalV2
          {...removeModal.bindings}
          root={document.getElementById("__plasmo")}
          actions={
            <>
              <ButtonV2
                fullWidth
                secondary
                onClick={() => removeModal.setOpen(false)}
              >
                {browser.i18n.getMessage("cancel")}
              </ButtonV2>
              <ButtonV2
                fullWidth
                onClick={async () => {
                  try {
                    await removeWallet(address);
                    setToast({
                      type: "success",
                      content: browser.i18n.getMessage(
                        "removed_wallet_notification"
                      ),
                      duration: 2000
                    });
                    setLocation("/quick-settings/wallets");
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
              </ButtonV2>
            </>
          }
        >
          <CenterText heading noMargin>
            {browser.i18n.getMessage("remove_wallet_modal_title")}
          </CenterText>
          <Spacer y={0.55} />
          <CenterText noMargin>
            {browser.i18n.getMessage("remove_wallet_modal_content")}
          </CenterText>
          <Spacer y={0.75} />
        </ModalV2>
      </Wrapper>
    </>
  );
}

const CenterText = styled(Text)`
  text-align: center;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 80px);
`;

const WalletName = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.25rem;
  font-weight: 600;
`;

const HardwareWalletIcon = styled.img.attrs({
  draggable: false
})`
  width: 32px;
  height: 32px;
  object-fit: contain;
  user-select: none;
`;

const WalletAddress = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.37rem;
  font-size: 0.875rem;
`;

export const CopyButton = styled(CopyIcon)`
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
  font-size: 1rem;
`;

const Warning = styled(Text)`
  color: rgb(255, 0, 0, 0.6);
`;

interface Props {
  address: string;
}
