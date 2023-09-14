import AddressScanner from "~components/popup/AddressScanner";
import { PageType, trackPage } from "~utils/analytics";
import { useState, useEffect, useRef } from "react";
import { isAddressFormat } from "~utils/format";
import styled, { css } from "styled-components";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  RefreshIcon
} from "@iconicicons/react";
import {
  Logo,
  LogoAndDetails,
  LogoWrapper,
  TokenName
} from "~components/popup/Token";

export default function Send({ id }: Props) {
  // address scanner
  const [showAddressScanner, setShowAddressScanner] = useState(false);

  // Segment
  useEffect(() => {
    trackPage(PageType.SEND);
  }, []);

  // quantity
  const [qty, setQty] = useState<string>("");

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("send")} />
        <Spacer y={1} />
        <QuantitySection>
          <Switch />
          <Quantity>
            <QuantityInput
              value={qty}
              onKeyDown={(e) => {
                if (
                  [
                    "Backspace",
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "."
                  ].includes(e.key)
                )
                  return;
                e.preventDefault();
              }}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0.00"
            />
            <Imitate>{qty !== "" ? qty : "0.00"}</Imitate>
          </Quantity>
          <Ticker>AR</Ticker>
          <Max>Max</Max>
        </QuantitySection>
        <Spacer y={1} />
        <Datas>
          <Text noMargin>≈US$2,345.43</Text>
          <Text noMargin>~0.0000043 AR network fee</Text>
        </Datas>
      </div>
      <BottomActions>
        <TokenSelector>
          <LogoAndDetails>
            <LogoWrapper>
              <Logo src="" />
            </LogoWrapper>
            <TokenName>Arweave</TokenName>
          </LogoAndDetails>
          <TokenSelectorRightSide>
            <Text noMargin>{browser.i18n.getMessage("currency")}</Text>
            <ChevronRightIcon />
          </TokenSelectorRightSide>
        </TokenSelector>
        <Button>
          Send
          <ArrowUpRightIcon />
        </Button>
      </BottomActions>
      <AddressScanner
        onScan={(data) => {
          if (!data) return;
          if (!isAddressFormat(data) && !data.includes(".ar")) {
            return;
          }

          // targetInput.setState(data);
          setShowAddressScanner(false);
        }}
        active={showAddressScanner}
        close={() => setShowAddressScanner(false)}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  gap: 2.5rem;
`;

interface Props {
  id?: string;
}

const QuantitySection = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
`;

const Quantity = styled.div`
  position: relative;
  width: max-content;
  z-index: 1;
`;

const qtyTextStyle = css`
  font-size: 3.7rem;
  font-weight: 500;
  line-height: 1.1em;
`;

const QuantityInput = styled.input.attrs({
  type: "text"
})`
  position: absolute;
  width: 100%;
  outline: none;
  border: none;
  background-color: transparent;
  padding: 0;
  z-index: 10;
  color: rgb(${(props) => props.theme.theme});
  text-align: right;
  ${qtyTextStyle}
`;

const Imitate = styled.p`
  color: transparent;
  z-index: 1;
  margin: 0;
  text-align: right;
  ${qtyTextStyle}
`;

const Ticker = styled.p`
  color: rgb(${(props) => props.theme.theme});
  margin: 0;
  text-transform: uppercase;
  ${qtyTextStyle}
`;

const BottomActions = styled(Section)`
  display: flex;
  gap: 1rem;
  flex-direction: column;
`;

const Datas = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-direction: column;
  justify-content: center;

  p {
    text-align: center;
    font-size: 0.83rem;
  }
`;

const floatingAction = css`
  position: absolute;
  top: 50%;
  cursor: pointer;
  transform: translateY(-50%);
  transition: all 0.17s ease;

  &:hover {
    opacity: 0.83;
  }

  &:active {
    transform: translateY(-50%) scale(0.94);
  }
`;

const Max = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.primaryText});
  font-size: 0.95rem;
  right: 20px;
  text-transform: uppercase;
  text-align: center;
  ${floatingAction}
`;

const Switch = styled(RefreshIcon)`
  font-size: 1.45rem;
  width: 1em;
  height: 1em;
  left: 20px;
  ${floatingAction}
`;

const TokenSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1.1rem;
  border-radius: 25px;
  cursor: pointer;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  transition: all 0.12s ease-;

  &:active {
    transform: scale(0.97);
  }

  p {
    color: rgb(${(props) => props.theme.theme});
  }
`;

const TokenSelectorRightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 0.36rem;

  svg {
    font-size: 1.5rem;
    width: 1em;
    height: 1em;
    color: rgb(${(props) => props.theme.theme});
  }

  p {
    text-transform: uppercase;
    font-size: 0.7rem;
  }
`;
