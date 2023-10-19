import { AnimatePresence, type Variants, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Button, Card } from "@arconnect/components";
import { CheckIcon } from "@iconicicons/react";
import browser from "webextension-polyfill";

import styled from "styled-components";

import Completed from "./gettingStarted/completed";
import Connect from "./gettingStarted/connect";
import { useLocation } from "wouter";
import Explore from "./gettingStarted/explore";

const gettingStartedPages = [<Completed />, <Explore />, <Connect />];

export default function GettingStarted({ page }) {
  // animate content sice
  const [contentSize, setContentSize] = useState<number>(0);
  const [, setLocation] = useLocation();
  const contentRef = useCallback<(el: HTMLDivElement) => void>((el) => {
    if (!el) return;

    const obs = new ResizeObserver(() => {
      if (!el || el.clientHeight <= 0) return;
      setContentSize(el.clientHeight);
    });

    obs.observe(el);
  }, []);

  const navigate = (pageNum: number) => {
    if (pageNum < 4) {
      setLocation(`/getting-started/${pageNum}`);
    } else {
      window.top.close();
    }
  };

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
        <Footer>
          <PageIndicatorContainer>
            {gettingStartedPages.map((_, i) => (
              <PageIndicator
                onClick={() => navigate(i + 1)}
                active={page === i + 1}
              />
            ))}
          </PageIndicatorContainer>
          <Button fullWidth onClick={() => navigate(page + 1)}>
            {browser.i18n.getMessage(page + 1 < 4 ? "next" : "done")}
          </Button>
        </Footer>
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

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const PageIndicatorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const PageIndicator = styled.button<{ active?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 10px;
  background-color: ${(props) => (props.active ? "#AB9AFF" : "#EBEBF1")};
  border: none;
  cursor: pointer;
  outline: none;
`;

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
  overflow: hidden;
  height: 100%;
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
  background-color: rgba(20, 209, 16, 0.05);
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
  justify-content: space-between;
  gap: 2rem;
  height: 582px;
  width: 416px;
`;
