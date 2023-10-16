import { AnimatePresence, type Variants, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Card } from "@arconnect/components";
import { CheckIcon } from "@iconicicons/react";

import styled from "styled-components";

import Confirm from "./generate/confirm";

import Completed from "./gettingStarted/completed";
import Connect from "./gettingStarted/connect";

const gettingStartedPages = [<Completed />, <Connect />, <Confirm />];

export default function GettingStarted({ page }) {
  // animate content sice
  const [contentSize, setContentSize] = useState<number>(0);
  const contentRef = useCallback<(el: HTMLDivElement) => void>((el) => {
    if (!el) return;

    const obs = new ResizeObserver(() => {
      if (!el || el.clientHeight <= 0) return;
      setContentSize(el.clientHeight);
    });

    obs.observe(el);
  }, []);

  return (
    <Wrapper>
      <SetupCard>
        <HeaderContainer>
          <Header>
            <CheckWrapper>
              <CheckIcon />
            </CheckWrapper>
            Setup Complete!
          </Header>
        </HeaderContainer>
        <Content>
          <PageWrapper style={{ height: contentSize }}>
            <AnimatePresence initial={false}>
              <Page key={page} ref={contentRef}>
                {gettingStartedPages[page - 1]}
              </Page>
            </AnimatePresence>
          </PageWrapper>
        </Content>
      </SetupCard>
    </Wrapper>
  );
}

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

const Page = styled(motion.div).attrs({
  variants: pageAnimation,
  initial: "exit",
  animate: "init"
})`
  position: absolute;
  width: 100%;
  height: max-content;
  left: 0;
  top: 0;
`;

const PageWrapper = styled.div`
  position: relative;
  transition: height 0.17s ease;
`;

const Content = styled.div`
  padding: 0 24px 20px;
  overflow: hidden;
`;
const CheckWrapper = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  color: #ffffff;

  background-color: rgba(20, 209, 16, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Header = styled.div`
  color: #14d110;

  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #14d110;
  border-radius: 25px;
  font-size: 10px;
  padding: 10px;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  flex-direction: column;
`;

const SetupCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 440px;
`;
