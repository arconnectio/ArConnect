import { AnimatePresence, motion, Variants } from "framer-motion";
import { CloseIcon } from "@iconicicons/react";
import { Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function LastTransaction() {
  return (
    <AnimatePresence>
      {true && (
        <Wrapper>
          <Content>{browser.i18n.getMessage("transaction_view_last")}</Content>
          <Close />
        </Wrapper>
      )}
    </AnimatePresence>
  );
}

const animation: Variants = {
  shown: {
    scaleY: 1,
    marginBottom: "1rem"
  },
  hidden: {
    scaleY: 0,
    marginBottom: "0"
  }
};

const Wrapper = styled(motion.div).attrs({
  variants: animation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden"
})`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  padding: 0.8rem 1rem;
  border-radius: 20px;
`;

const Content = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.theme});
`;

const Close = styled(CloseIcon)`
  font-size: 1rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.theme});
  transition: all 0.125s ease-in-out;

  &:active {
    transform: scale(0.96);
  }
`;
