import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Button, Spacer, Text } from "@arconnect/components";
import { ArrowRightIcon, KeyIcon } from "@iconicicons/react";
import { AnimatePresence, motion } from "framer-motion";
import styled, { keyframes } from "styled-components";
import { useLocation } from "wouter";
import Screenshots from "~components/welcome/start/Screenshots";
import browser from "webextension-polyfill";

export default function Home() {
  // button refs
  const startButton = useRef<HTMLButtonElement>();
  const walletButton = useRef<HTMLButtonElement>();

  // position of the expand animation element
  const [expandPos, setExpandPos] = useState<{ x: number; y: number }>();

  // expand animation functionality
  const animate = (btn: MutableRefObject<HTMLButtonElement>) =>
    new Promise<void>((res) => {
      // get pos
      const btnDimensions = btn.current.getBoundingClientRect();

      setExpandPos({
        x: btnDimensions.x + btnDimensions.width / 2,
        y: btnDimensions.y + btnDimensions.height / 2
      });

      // wait for the animation to complete
      setTimeout(res, expand_animation_duration + 750);
    });

  // window size
  const windowDimensions = useWindowDimensions();

  // circle size
  const circleSize = useMemo(
    () =>
      windowDimensions.height > windowDimensions.width
        ? windowDimensions.height
        : windowDimensions.width,
    [windowDimensions]
  );

  // router
  const [, setLocation] = useLocation();

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
            <WelcomeButton
              ref={startButton}
              onClick={async () => {
                await animate(startButton);
                setLocation("/start");
              }}
            >
              {browser.i18n.getMessage("get_me_started")}
              <ArrowRightIcon />
            </WelcomeButton>
            <WelcomeButton
              secondary
              ref={walletButton}
              onClick={async () => {
                await animate(walletButton);
                setLocation("/load");
              }}
            >
              {browser.i18n.getMessage("have_wallet")}
              <KeyIcon />
            </WelcomeButton>
          </ButtonsWrapper>
        </WelcomeContent>
      </Panel>
      <ArConnectPanel>
        <ScreenshotsWelcome />
      </ArConnectPanel>
      <AnimatePresence>
        {expandPos && (
          <ExpandAnimationElement pos={expandPos} circleSize={circleSize} />
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
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

const ArConnectPanel = styled(Panel)`
  background-color: #000;
`;

const ScreenshotsWelcome = styled(Screenshots)`
  left: 5%;
  right: 5%;
  z-index: 1;
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

// in ms
const expand_animation_duration = 0.75;

const ExpandAnimationElement = styled(motion.div).attrs<{
  pos: { x: number; y: number };
  circleSize: number;
}>((props) => ({
  variants: {
    closed: {
      opacity: 0.2,
      clipPath: `circle(20px at ${props.pos.x + "px"} ${props.pos.y + "px"})`,
      transition: {
        type: "easeInOut",
        duration: expand_animation_duration
      }
    },
    open: {
      opacity: 1,
      clipPath: `circle(${props.circleSize + "px"} at ${props.pos.x + "px"} ${
        props.pos.y + "px"
      })`,
      transition: {
        type: "easeInOut",
        duration: expand_animation_duration
      }
    }
  },
  initial: "closed",
  animate: "open",
  exit: "closed"
}))<{ pos: { x: number; y: number }; circleSize: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: #fff;
  z-index: 1000;
`;

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;

  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    const lisetener = () => setWindowDimensions(getWindowDimensions());

    window.addEventListener("resize", lisetener);

    return () => window.removeEventListener("resize", lisetener);
  }, []);

  return windowDimensions;
}
