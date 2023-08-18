import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAnalytics } from "~utils/analytics";
import browser from "webextension-polyfill";

export default function AnalyticsConsent() {
  const [answeredAnalytics, toggle] = useAnalytics();

  return (
    <>
      <AnimatePresence>
        {!answeredAnalytics && (
          <ConsentDialog>
            {browser.i18n.getMessage("analytic_description")}
            <Buttons>
              <Button onClick={() => toggle(true)}>
                {browser.i18n.getMessage("accept")}
              </Button>
              <Button onClick={() => toggle(false)}>
                {browser.i18n.getMessage("decline")}
              </Button>
            </Buttons>
          </ConsentDialog>
        )}
        {!answeredAnalytics && <BackgroundLayer />}
      </AnimatePresence>
    </>
  );
}

const backgroundAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const dialogAnimation: Variants = {
  hidden: { opacity: 0, translateY: 10 },
  shown: { opacity: 1, translateY: 0 }
};

const ConsentDialog = styled(motion.div).attrs({
  variants: dialogAnimation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  transition: { duration: 0.25 }
})`
  position: fixed;
  display: flex;
  align-items: center;
  gap: 1.24rem;
  padding: 0.75rem 1rem;
  background-color: rgb(${(props) => props.theme.background});
  border-radius: 15px;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 201;

  @media screen and (max-width: 720px) {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    padding: 0.7rem 0.8rem;
  }
`;

const BackgroundLayer = styled(motion.div).attrs({
  variants: backgroundAnimation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  transition: { duration: 0.18 }
})`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 200;
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;

  @media screen and (max-width: 720px) {
    flex-direction: column;
    gap: 0.6rem;
  }
`;

const Button = styled.button<{ secondary?: boolean }>`
  background-color: ${(props) =>
    !props.secondary ? "#AB9AFF" : "transparent"};

  // color: ${(props) => (!props.secondary ? "#fff" : "#14d110")};
  color: rgb(${(props) => props.theme.displayTheme});

  font-size: 0.9rem;
  font-weight: 550;
  border-radius: 9px;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  outline: none;
  border: none;
  text-align: center;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      255,
      255,
      255,
      ${(props) => (!props.secondary ? ".8" : ".05")}
    );
  }

  &:active {
    background-color: rgba(
      0,
      0,
      0,
      ${(props) => (!props.secondary ? ".75" : ".032")}
    );
  }
`;
