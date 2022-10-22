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
          <RotatingName>
            <RotatingNameSpan>ArConnect</RotatingNameSpan>
          </RotatingName>
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

const RotatingName = styled(LargeTitle)`
  color: rgb(${(props) => props.theme.theme});
  perspective: 3000px;
  overflow: hidden;
`;

const rotate = keyframes`
  0% {
    transform: rotateX(0) translateY(0);
  }
  5% {
    transform: rotateX(90deg) translateY(-22px);
  }
  50% {
    transform: rotateX(90deg) translateY(-20px);
  }
  55% {
    transform: rotateX(0) translateY(0);
  }
`;

const RotatingNameSpan = styled.span`
  display: block;
  position: relative;
  transform-origin: 50% 0;
  transform-style: preserve-3d;
  animation: ${rotate} 4s linear infinite;

  &::before {
    content: "Arweave";
    position: absolute;
    left: 1%;
    top: 102%;
    width: 100%;
    height: 100%;
    transform: rotateX(-90deg) translateY(2px);
    transform-origin: 50% 0;
  }
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
