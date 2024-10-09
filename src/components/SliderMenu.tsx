import { type DisplayTheme } from "@arconnect/components";
import { CloseIcon } from "@iconicicons/react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type React from "react";
import { useRef } from "react";
import styled, { useTheme } from "styled-components";

interface SliderMenuProps {
  title: string;
  isOpen: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export default function SliderMenu({
  title,
  isOpen,
  onClose,
  children
}: SliderMenuProps) {
  const wrapperElementRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();

  const contentElement = isOpen ? (
    <>
      <CloseLayer
        key="SliderMenuCloseLayer"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <Wrapper
        displayTheme={theme.displayTheme}
        ref={wrapperElementRef}
        variants={animationSlideFromBottom}
        initial="hidden"
        animate="shown"
        exit="hidden"
      >
        <Body>
          <Header>
            <Title>{title}</Title>
            <ExitButton onClick={onClose} />
          </Header>
          {children}
        </Body>
      </Wrapper>
    </>
  ) : null;

  return <AnimatePresence>{contentElement}</AnimatePresence>;
}

const ExitButton = styled(CloseIcon)`
  cursor: pointer;
`;

const Wrapper = styled(motion.div)<{ displayTheme: DisplayTheme }>`
  position: fixed;
  bottom: 0;
  left: 0;
  height: auto;
  max-height: 93%;
  border: ${(props) =>
    props.displayTheme === "light"
      ? `1px solid ${props.theme.primary}`
      : "none"};
  display: flex;
  flex-direction: column;
  width: 100%;
  z-index: 1000;
  overflow: scroll;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "#191919"};
  border-radius: 10px 10px 0 0;
`;

export const animationSlideFromBottom: Variants = {
  hidden: {
    y: "100vh",
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  shown: {
    y: "0",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

const Body = styled.div`
  padding: 1.0925rem;
  display: flex;
  gap: 15px;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  padding: 0;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;

export const CloseLayer = styled(motion.div)`
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  cursor: default;
  background-color: rgba(${(props) => props.theme.background}, 0.85);
`;
