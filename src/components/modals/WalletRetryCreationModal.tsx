import { ButtonV2, ModalV2, Spacer } from "@arconnect/components";
import { useRef, useState } from "react";
import browser from "webextension-polyfill";
import { ContentWrapper, Content, HeaderText, CenterText } from "./Components";
import styled from "styled-components";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { getWalletKeyLength } from "~wallets";

interface Props {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  onRetry: (
    retry?: boolean
  ) => Promise<Partial<{ seedphrase: string; jwk: JWKInterface }>>;
}

export const WalletRetryCreationModal = ({
  isOpen,
  setOpen,
  onRetry
}: Props) => {
  const modalRef = useRef(null);
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    if (loading) return;
    setLoading(true);
    try {
      const { jwk } = await onRetry(true);
      const { actualLength, expectedLength } = await getWalletKeyLength(jwk);
      if (actualLength === expectedLength) {
        setOpen(false);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <ModalV2
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
      actions={<></>}
    >
      <ContentWrapper ref={modalRef}>
        <Content>
          <div>
            <HeaderText noMargin heading>
              {browser.i18n.getMessage(
                "generate_wallet_key_length_short_error_title"
              )}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage(
                "generate_wallet_key_length_short_error"
              )}
            </CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonsWrapper>
          <ButtonV2 fullWidth onClick={handleRetry} loading={loading}>
            {browser.i18n.getMessage("retry")}
          </ButtonV2>
          <ButtonV2 fullWidth secondary onClick={() => setOpen(false)}>
            {browser.i18n.getMessage("cancel")}
          </ButtonV2>
        </ButtonsWrapper>
        <Spacer y={0.5} />
        {loading && (
          <CenterText>
            {browser.i18n.getMessage("generate_wallet_in_progress")}
          </CenterText>
        )}
      </ContentWrapper>
    </ModalV2>
  );
};

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
