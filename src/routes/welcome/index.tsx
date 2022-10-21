import { Button, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled, { keyframes } from "styled-components";
import { ArrowRightIcon, KeyIcon } from "@iconicicons/react";

export default function Home() {
  return (
    <Wrapper>
      <Panel>
        <WelcomeContent>
          <LargeTitle>{browser.i18n.getMessage("welcome_to")}</LargeTitle>
          <RotatingName>ArConnect</RotatingName>
          <Spacer y={1.35} />
          <ButtonsWrapper>
            <WelcomeButton>
              {browser.i18n.getMessage("get_me_started")}
              <ArrowRightIcon />
            </WelcomeButton>
            <WelcomeButton secondary>
              {browser.i18n.getMessage("have_wallet")}
              <KeyIcon />
            </WelcomeButton>
          </ButtonsWrapper>
        </WelcomeContent>
      </Panel>
      <EcosystemPanel></EcosystemPanel>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  width: 100vw;
  height: 100vh;
`;

const Panel = styled.div`
  position: relative;
  width: 50%;
  height: 100%;
`;

const EcosystemPanel = styled(Panel)`
  background-color: #000;
`;

const WelcomeContent = styled.div`
  position: absolute;
  top: 50%;
  left: 14%;
  transform: translateY(-50%);
`;

const LargeTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  line-height: 1.05em;
  font-size: 4rem;
`;

const rotate = keyframes`
  0% {
    transform: rotateX(0);
  }
	20% {
    transform: rotateX(180deg);
  }
  40% {
    transform: rotateX(0);
  }
`;

const RotatingName = styled(LargeTitle)`
  color: rgb(${(props) => props.theme.theme});
  animation: ${rotate} 3s linear infinite;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const WelcomeButton = styled(Button)`
  padding-left: 0;
  padding-right: 0;
  width: calc(100% - 0.75rem * 1);
`;
