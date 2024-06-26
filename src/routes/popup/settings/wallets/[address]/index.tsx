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
import { QRCodeSVG } from "qrcode.react";
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
      <HeadV2 title={browser.i18n.getMessage("edit_wallet")} />
      <Wrapper>
        <div>
          <WalletWrapper>
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
            <QrCodeIcon address={address} />
          </WalletWrapper>
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
            onClick={() =>
              setLocation(`/quick-settings/wallets/${address}/export`)
            }
            disabled={wallet.type === "hardware"}
          >
            <DownloadIcon style={{ marginRight: "5px" }} />
            {browser.i18n.getMessage("export_keyfile")}
          </ButtonV2>
          <Spacer y={0.625} />
          <ButtonV2
            fullWidth
            style={{ backgroundColor: "#8C1A1A" }}
            onClick={() => removeModal.setOpen(true)}
          >
            <TrashIcon style={{ marginRight: "5px" }} />
            {browser.i18n.getMessage("remove_wallet")}
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

function QrCodeIcon({ address }: { address: string }) {
  // QR modal
  const qrModal = useModal();

  return (
    <>
      <LogoWrapper onClick={() => qrModal.setOpen(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="33.333"
          height="33.333"
          viewBox="0 0 35 34"
          fill="none"
        >
          <path
            d="M9.86111 9.36111H9.875M25.1389 9.36111H25.1528M9.86111 24.6389H9.875M18.8889 18.3889H18.9028M25.1389 24.6389H25.1528M24.4444 29.5H30V23.9444M20.2778 23.25V29.5M30 19.7778H23.75M22.5 14.2222H27.7778C28.5556 14.2222 28.9446 14.2222 29.2417 14.0708C29.503 13.9377 29.7155 13.7252 29.8486 13.4639C30 13.1668 30 12.7779 30 12V6.72222C30 5.94437 30 5.55545 29.8486 5.25835C29.7155 4.99701 29.503 4.78454 29.2417 4.65138C28.9446 4.5 28.5556 4.5 27.7778 4.5H22.5C21.7221 4.5 21.3332 4.5 21.0361 4.65138C20.7748 4.78454 20.5623 4.99701 20.4292 5.25835C20.2778 5.55545 20.2778 5.94437 20.2778 6.72222V12C20.2778 12.7779 20.2778 13.1668 20.4292 13.4639C20.5623 13.7252 20.7748 13.9377 21.0361 14.0708C21.3332 14.2222 21.7221 14.2222 22.5 14.2222ZM7.22222 14.2222H12.5C13.2779 14.2222 13.6668 14.2222 13.9639 14.0708C14.2252 13.9377 14.4377 13.7252 14.5708 13.4639C14.7222 13.1668 14.7222 12.7779 14.7222 12V6.72222C14.7222 5.94437 14.7222 5.55545 14.5708 5.25835C14.4377 4.99701 14.2252 4.78454 13.9639 4.65138C13.6668 4.5 13.2779 4.5 12.5 4.5H7.22222C6.44437 4.5 6.05545 4.5 5.75835 4.65138C5.49701 4.78454 5.28454 4.99701 5.15138 5.25835C5 5.55545 5 5.94437 5 6.72222V12C5 12.7779 5 13.1668 5.15138 13.4639C5.28454 13.7252 5.49701 13.9377 5.75835 14.0708C6.05545 14.2222 6.44437 14.2222 7.22222 14.2222ZM7.22222 29.5H12.5C13.2779 29.5 13.6668 29.5 13.9639 29.3486C14.2252 29.2155 14.4377 29.003 14.5708 28.7417C14.7222 28.4446 14.7222 28.0556 14.7222 27.2778V22C14.7222 21.2221 14.7222 20.8332 14.5708 20.5361C14.4377 20.2748 14.2252 20.0623 13.9639 19.9292C13.6668 19.7778 13.2779 19.7778 12.5 19.7778H7.22222C6.44437 19.7778 6.05545 19.7778 5.75835 19.9292C5.49701 20.0623 5.28454 20.2748 5.15138 20.5361C5 20.8332 5 21.2221 5 22V27.2778C5 28.0556 5 28.4446 5.15138 28.7417C5.28454 29.003 5.49701 29.2155 5.75835 29.3486C6.05545 29.5 6.44437 29.5 7.22222 29.5Z"
            stroke="white"
            stroke-width="2.77778"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </LogoWrapper>
      <ModalV2 {...qrModal.bindings} root={document.getElementById("__plasmo")}>
        <QRCodeSVG
          fgColor="#fff"
          bgColor="transparent"
          size={240}
          value={address ?? ""}
        />
      </ModalV2>
    </>
  );
}

const LogoWrapper = styled.div<{ small?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => (props.small ? "2.1875rem" : "2.8rem;")};
  height: ${(props) => (props.small ? "2.1875rem" : "2.8rem;")};
  background-color: ${(props) => props.theme.primary};
  cursor: pointer;
  border-radius: 11.905px;

  &:hover {
    background-color: ${(props) => props.theme.primaryBtnHover};
  }
`;

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

const WalletWrapper = styled.div`
  display: flex;
  justify-content: space-between;
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
