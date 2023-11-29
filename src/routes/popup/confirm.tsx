import { useState, useEffect } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { ArrowLeftIcon } from "@iconicicons/react";
import { Section } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";
import { getActiveWallet } from "~wallets";

export default function ConfirmPurchase() {
  const [push] = useHistory();

  const theme = useTheme();

  const [activeWallet, setActiveWallet] = useState("");
  const [selectedFiat, setSelectedFiat] = useState("");
  const [payout, setPayout] = useState(0);
  const [rate, setRate] = useState(0);
  const [networkFee, setNetworkFee] = useState(0);
  const [vendorFee, setVendorFee] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    async function fetchActiveWallet() {
      const wallet = await getActiveWallet();
      setActiveWallet(wallet.address);
    }
    fetchActiveWallet();
  }, []);

  async function getActiveQuote() {
    const activeQuote = await ExtensionStorage.get("quote");

    return activeQuote;
  }

  useEffect(() => {
    async function fetchActiveQuote() {
      const quote = await getActiveQuote();
      console.log(quote);

      setSelectedFiat(quote.selectedFiat.toUpperCase());
      setPayout(quote.payout);
      const totalRate = (Number(quote.payout) * Number(quote.rate)).toFixed(2);
      setRate(totalRate);
      setNetworkFee(quote.networkFee);
      setVendorFee(quote.transactionFee);
      const total =
        Number(totalRate) +
        Number(quote.networkFee) +
        Number(quote.transactionFee);
      setTotalCost(total);
    }
    fetchActiveQuote();
  }, []);

  return (
    <Wrapper>
      <div>
        <Header>
          <BackWrapper>
            <ExitIcon onClick={() => push("/purchase")}>
              {browser.i18n.getMessage("exit_buy_screen")}
            </ExitIcon>
          </BackWrapper>
          <Title>{browser.i18n.getMessage("confirm_purchase_title")}</Title>
        </Header>
        <MainContent>
          <WalletTitle>{browser.i18n.getMessage("wallet_address")}</WalletTitle>
          <Address>{activeWallet}</Address>
          <OrderTitle>{browser.i18n.getMessage("order_details")}</OrderTitle>
          <HL />
          <DetailWrapper>
            <DetailTitle>{browser.i18n.getMessage("confirm_rate")}</DetailTitle>
            <DetailValue>
              {payout} {browser.i18n.getMessage("AR_button")} = {rate}{" "}
              {selectedFiat}
            </DetailValue>
          </DetailWrapper>
          <HL />
          <DetailWrapper>
            <DetailTitle>
              {browser.i18n.getMessage("transaction_fee")}
            </DetailTitle>
            <DetailValue>
              {networkFee} {selectedFiat}
            </DetailValue>
          </DetailWrapper>
          <HL />
          <DetailWrapper>
            <DetailTitle>
              {browser.i18n.getMessage("confirm_vendor_fee")}
            </DetailTitle>
            <DetailValue>
              {vendorFee} {selectedFiat}
            </DetailValue>
          </DetailWrapper>
          <HL />
          <DetailWrapper>
            <OrderTitle>{browser.i18n.getMessage("confirm_total")}</OrderTitle>
            <OrderTitle>
              {totalCost} {selectedFiat}
            </OrderTitle>
          </DetailWrapper>
        </MainContent>
      </div>
      <Section>
        <BuyButton padding={false} route={"/confirm-purchase"} logo={false} />
      </Section>
    </Wrapper>
  );
}

const DetailValue = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
`;

const DetailTitle = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: 200;
`;

const DetailWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HL = styled.hr`
  width: 100%;
  border: 1px solid #ab9aff26;
`;

const OrderTitle = styled.div`
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
`;

const Address = styled.div`
  color: #ffffffb2;
  font-size: 13px;
  margin-bottom: 33px;
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
  justify-content: flex-start;
  padding: 23.6px 12px 12.4px 12px;
  margin-bottom: 18px;
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
  margin: 0px 12px 0px 3px;

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

const ExitIcon = styled(ArrowLeftIcon)`
  color: #ab9aff;
  height: 30px;
  width: 30px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 12px 4.8px 12px;
`;
