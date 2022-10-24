import {
  Button,
  Card,
  Input,
  Section,
  Spacer,
  Text
} from "@arconnect/components";
import { ChevronDownIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { formatAddress } from "~utils/format";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Label from "~components/auth/Label";
import Head from "~components/popup/Head";
import App from "~components/auth/App";
import styled from "styled-components";

export default function SignIn() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("sign_in")} showOptions={false} />
        <Spacer y={0.75} />
        <App
          appName="ArDrive"
          appUrl="ardrive.io"
          appIcon="https://avatars.githubusercontent.com/u/69483974?s=280&v=4"
        />
        <Spacer y={1.5} />
        <Section>
          <Label>{browser.i18n.getMessage("wallet")}</Label>
          <Spacer y={0.4} />
          <WalletSelect>
            <Address>{formatAddress(activeAddress || "", 10)}</Address>
            <SelectIcon />
          </WalletSelect>
          <Spacer y={1} />
          <Input
            type="password"
            placeholder={browser.i18n.getMessage("enter_your_password")}
            label={browser.i18n.getMessage("password")}
            fullWidth
          />
        </Section>
      </div>
      <Section>
        <Button fullWidth>{browser.i18n.getMessage("sign_in")}</Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}

const WalletSelect = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-width: 2.5px;
  border-radius: 22px;
`;

const Address = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.theme});
`;

const SelectIcon = styled(ChevronDownIcon)`
  font-size: 1.25rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.theme});
`;
