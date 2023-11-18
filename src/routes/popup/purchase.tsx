import { useState } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled, { css } from "styled-components";
import { hoverEffect } from "~utils/theme";
import { CloseIcon, ChevronDownIcon } from "@iconicicons/react";
import { Section, Input, Card } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";

export default function Purchase() {
  const [push] = useHistory();

  const [fiatSwitchOpen, setFiatSwitchOpen] = useState(false);

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("buy_screen_title")}</Title>
          <BackWrapper>
            <ExitIcon onClick={() => push("/")}>
              {browser.i18n.getMessage("exit_buy_screen")}
            </ExitIcon>
          </BackWrapper>
        </Header>
        <MainSwap>
          <FiatWrapper>
            <FiatInput type="number" placeholder="Enter amount" />
            <FiatSelect
              onClick={() => setFiatSwitchOpen(true)}
              open={fiatSwitchOpen}
            >
              $USD
              <SelectIcon />
            </FiatSelect>
          </FiatWrapper>
        </MainSwap>
      </div>
      <Section>
        <BuyButton padding={false} route={"/confirm-purchase"} logo={false} />
      </Section>
    </Wrapper>
  );
}

const FiatWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #ab9aff26;
  padding: 10px;
  border: 1px solid #ab9aff26;
  border-radius: 12px;
`;

const FiatInput = styled(Input)`
  background-color: transparent;
  border: none;
  color: #ffffffb2;
  font-size: 16px;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  appearance: textfield;
`;

const SelectIcon = styled(ChevronDownIcon)`
  width: 37px;
  height: 37px;
  color: white;
`;

const FiatSelect = styled(Card)<{ open: boolean }>`
  position: relative;
  display: flex;
  width: 84px;
  height: 38px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #ab9aff;
  transition: all 0.23s ease-in-out;
  font-size: 16px;
  border-radius: 12px;
  padding: 2px 3px 2px 10px;
  cursor: pointer;
  font-weight: 500;

  ${(props) =>
    props.open
      ? `border-color: rgba(${props.theme.theme}, .5); box-shadow: 0 0 0 1px rgba(${props.theme.theme}, .5);`
      : ""}

  ${SelectIcon} {
    transform: ${(props) => (props.open ? "rotate(180deg)" : "rotate(0)")};
  }
`;

const ReceiveInput = styled.div``;

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

const MainSwap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 12px 4.8px 12px;
`;
