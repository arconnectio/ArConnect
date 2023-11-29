import { useState, useEffect } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { CloseIcon } from "@iconicicons/react";
import { Section, Card, Spacer, Button } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";
import { getActiveWallet } from "~wallets";

export default function ConfirmPurchase() {
  const [push] = useHistory();

  const theme = useTheme();

  const [activeWallet, setActiveWallet] = useState("");

  useEffect(() => {
    async function fetchActiveWallet() {
      const wallet = await getActiveWallet();
      setActiveWallet(wallet.address);
    }
    fetchActiveWallet();
  }, []);

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("confirm_purchase_title")}</Title>
          <BackWrapper>
            <ExitIcon onClick={() => push("/purchase")}>
              {browser.i18n.getMessage("exit_buy_screen")}
            </ExitIcon>
          </BackWrapper>
        </Header>
        <MainContent>
          <WalletTitle>{browser.i18n.getMessage("wallet_address")}</WalletTitle>
          <Address>{activeWallet}</Address>
        </MainContent>
      </div>
      <Section>
        <BuyButton padding={false} route={"/confirm-purchase"} logo={false} />
      </Section>
    </Wrapper>
  );
}

const Address = styled.div`
  color: #ffffffb2;
  font-size: 13px;
`;

const WalletTitle = styled.div`
  height: 33px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 500;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 23.6px 12px 12.4px 12px;
  margin-bottom: 10px;
`;

const Title = styled.div`
  color: #ab9aff;
  display: inline-block;
  font-size: 22px;
  font-weight: 500;
`;

const BackWrapper = styled.div`
  position: relative;
  display: flex;
  width: max-content;
  height: max-content;
  cursor: pointer;

  ${hoverEffect}

  &::after {
    width: 158%;
    height: 158%;
    border-radius: 100%;
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const ExitIcon = styled(CloseIcon)`
  color: #ab9aff;
  height: 30px;
  width: 30px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 12px 4.8px 12px;
`;
