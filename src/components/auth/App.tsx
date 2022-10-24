import { Gateway, concatGatewayURL } from "~applications/gateway";
import { Section, Spacer, Text } from "@arconnect/components";
import { GridIcon } from "@iconicicons/react";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Label from "./Label";

export default function App({ appIcon, appName, appUrl, gateway }: Props) {
  return (
    <>
      <SidePaddingSection>
        <Label>{browser.i18n.getMessage("app_wants_to_connect")}</Label>
      </SidePaddingSection>
      <Spacer y={0.4} />
      <SidePaddingSection size="slim">
        <Wrapper>
          <AppIcon img={appIcon} key={appIcon}>
            {!appIcon && <NoAppIcon />}
          </AppIcon>
          <div>
            <AppName>{appName || appUrl}</AppName>
            <AppUrl>
              {browser.i18n.getMessage("gateway")}
              {": "}
              {concatGatewayURL(gateway)}
            </AppUrl>
          </div>
        </Wrapper>
      </SidePaddingSection>
    </>
  );
}

const SidePaddingSection = styled(Section)`
  padding-top: 0;
  padding-bottom: 0;
`;

const Wrapper = styled.div`
  background-color: #000;
  border-radius: 27px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;

const AppIcon = styled(Squircle)`
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  color: rgb(${(props) => props.theme.theme});
`;

const NoAppIcon = styled(GridIcon)`
  position: absolute;
  font-size: 1.5rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const AppName = styled(Text).attrs({
  heading: true,
  noMargin: true
})`
  font-size: 1.3rem;
  font-weight: 500;

  color: #fff;
`;

const AppUrl = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.7rem;
`;

interface Props {
  appIcon?: string;
  appName?: string;
  appUrl: string;
  gateway: Gateway;
}
