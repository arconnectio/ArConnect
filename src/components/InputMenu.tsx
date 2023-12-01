import browser from "webextension-polyfill";
import styled from "styled-components";
import { useTheme } from "~utils/theme";
import type { DisplayTheme } from "@arconnect/components";
import { SelectIcon } from "~routes/popup/purchase";
import gPay from "url:/assets/ecosystem/g-pay.svg";

export default function InputMenu() {
  const theme = useTheme();

  return (
    <SelectInput displayTheme={theme}>
      <PaymentWrapper>
        <IconWrapper>
          <PaymentIcon src={gPay} alt={"Google Pay"} draggable={false} />
        </IconWrapper>
        Google Pay
      </PaymentWrapper>

      <SelectIcon open={false} />
    </SelectInput>
  );
}

const SelectInput = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #ab9aff26;
  padding: 10px;
  border: ${(props) =>
    props.displayTheme === "light"
      ? "1px solid #AB9AFF"
      : "1px solid #ab9aff26"};
  border-radius: 12px;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 500;
  padding: 12.91px 5px 12.91px 12.91px;
`;

const PaymentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 100%;
  background-color: #ffffff;
`;

const PaymentIcon = styled.img`
  width: 48px;
  height: 48px;
  background-color: transparent;
`;
