import { AnimatePresence, motion, Variants } from "framer-motion";
import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@arconnect/components";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Token({ id }: Props) {
  // display theme
  const theme = useTheme();

  // router
  const [, setLocation] = useLocation();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const { state } = useSandboxedTokenState(id, sandbox);

  const balance = useMemo(() => {
    if (!state?.balances || !activeAddress) {
      return "0";
    }

    const bal = state.balances[activeAddress] || 0;

    return bal.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [state, activeAddress]);

  const [price, setPrice] = useState<number>();

  return (
    <>
      <AnimatePresence>
        {state && (
          <Wrapper onClick={() => setLocation(`/token/${id}`)}>
            <LogoAndDetails>
              <Logo
                src={`https://meta.viewblock.io/AR.${id}/logo?t=${theme}`}
              />
              <div>
                <PrimaryText>
                  {(state.name && `${state.name} (${state.ticker})`) ||
                    state.ticker}
                </PrimaryText>
                <Ticker>
                  {balance} {state.ticker}
                </Ticker>
              </div>
            </LogoAndDetails>
            {price && <PrimaryText>{price}</PrimaryText>}
          </Wrapper>
        )}
      </AnimatePresence>
      <iframe
        src={browser.runtime.getURL("tabs/sandbox.html")}
        ref={sandbox}
        style={{ display: "none" }}
      ></iframe>
    </>
  );
}

const animation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const Wrapper = styled(motion.div).attrs({
  variants: animation,
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  transition: { duration: 0.2, ease: "easeInOut" }
})`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.82;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const LogoAndDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Logo = styled.img.attrs({
  draggable: false,
  alt: "logo"
})`
  width: 2.4rem;
  height: 2.4rem;
  object-fit: cover;
  user-select: none;
`;

const PrimaryText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 1.1rem;
  color: rgb(${(props) => props.theme.primaryText});
`;

const Ticker = styled.span`
  font-size: 0.75rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 500;
`;

interface Props {
  id: string;
}
