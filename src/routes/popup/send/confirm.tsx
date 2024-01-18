import { Input, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import { SendButton } from ".";
import { formatAddress } from "~utils/format";
import { useStorage } from "@plasmohq/storage/hook";

import { ExtensionStorage } from "~utils/storage";

import { useEffect, useState } from "react";
import { useTokens } from "~tokens";

interface Props {
  tokenID: string;
  qty: number;
  recipient: string;
  message?: string;
}

export default function Confirm({ tokenID, qty, recipient, message }: Props) {
  // TODO: Need to get Token information
  const [ticker, setTicker] = useState<string>("");

  const tokens = useTokens();
  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  useEffect(() => {
    if (tokenID === "AR") {
      setTicker("AR");
    } else {
      const token = tokens.find((token) => token.id === tokenID);
      setTicker(token.ticker);
    }
  }, [tokenID]);

  return (
    <Wrapper>
      <HeadV2 title={"Confirm Transaction"} />
      <ConfirmWrapper>
        <BodyWrapper>
          <AddressWrapper>
            <Address>
              Main{" "}
              <span style={{ color: "#aeadcd" }}>
                ({activeAddress && formatAddress(activeAddress, 5)})
              </span>
            </Address>
            <ArrowRightIcon />
            <Address>{formatAddress(recipient, 5)}</Address>
          </AddressWrapper>
          <div style={{ marginTop: "16px" }}>
            <BodySection
              ticker={ticker}
              title={`Sending ${ticker}`}
              value={qty}
              estimatedValue="9.83"
            />
            <BodySection
              alternate
              title={"AR network fee"}
              subtitle="(estimated)"
              value={0.01598256479}
              estimatedValue="x.xx"
            />
            <BodySection
              alternate
              title={"Total"}
              value={1.01598256479}
              estimatedValue="x.xx"
            />
          </div>
          {/* Password if Necessary */}
          <PasswordWrapper>
            <Description>Enter password to sign transaction</Description>
            <Input
              placeholder="Enter your password"
              small
              label={"Password"}
              type="password"
              fullWidth
              alternative
            />
          </PasswordWrapper>
        </BodyWrapper>
        <SendButton fullWidth>Confirm {">"}</SendButton>
      </ConfirmWrapper>
    </Wrapper>
  );
}

const PasswordWrapper = styled.div`
  display: flex;
  padding-top: 16px;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
const Description = styled.p`
  margin: 0;
  font-size: 16px;
  padding-bottom: 15px;
  color: #aeadcd;
  font-weight: 500;
`;

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

type BodySectionProps = {
  title: string;
  subtitle?: string;
  value: number;
  ticker?: string;
  estimatedValue: string;
  alternate?: boolean;
};

function BodySection({
  title,
  subtitle,
  value,
  ticker = "AR",
  estimatedValue,
  alternate
}: BodySectionProps) {
  return (
    <SectionWrapper alternate={alternate}>
      <Titles>
        {subtitle ? (
          <>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </>
        ) : (
          <h2>{title}</h2>
        )}
      </Titles>
      <Price>
        <ArAmount alternate={alternate}>
          {value}
          <p>{ticker}</p>
        </ArAmount>
        <ConvertedAmount>${estimatedValue}</ConvertedAmount>
      </Price>
    </SectionWrapper>
  );
}

const Titles = styled.div`
  p {
    margin: 0;
    padding: 0;
    color: #aeadcd;
  }
`;

const Wrapper = styled.div`
  height: calc(100vh - 75px);
  position: relative;
`;

const ConfirmWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  height: 100%;
  flex-direction: column;
  padding: 0 15px;
  overflow: hidden;
`;

const Address = styled.div`
  background-color: rgba(171, 154, 255, 0.15);
  border: 1px solid rgba(171, 154, 255, 0.17);
  padding: 7px 4px;
  border-radius: 10px;
`;

const AddressWrapper = styled.div`
  display: flex;
  font-size: 16px;
  color: ${(props) => props.theme.theme};
  font-weight: 500;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const SectionWrapper = styled.div<{ alternate?: boolean }>`
  display: flex;
  padding: 16px 0;
  align-items: start;
  justify-content: space-between;

  h2 {
    margin: 0;
    padding: 0;
    font-size: ${(props) => (props.alternate ? "16px" : "20px")};
    font-weight: 600;
    color: ${(props) => props.theme.theme};
  }

  :not(:last-child) {
    border-bottom: 1px solid #ab9aff;
  }
`;

const Price = styled.div`
  display: flex;
  align-items: end;
  flex-direction: column;
`;

const ArAmount = styled.div<{ alternate?: boolean }>`
  display: inline-flex;
  align-items: baseline;
  font-size: ${(props) => (props.alternate ? "16px" : "32px")};
  font-weight: 600;
  gap: 2px;
  p {
    line-height: 100%;
    font-size: ${(props) => (props.alternate ? "10px" : "14px")};
    font-weight: bold;
    color: ${(props) => props.theme.theme};
    margin: 0;
  }
`;

const ConvertedAmount = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #aeadcd;
`;
