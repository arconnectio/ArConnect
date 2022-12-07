import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Spacer, Text } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Collectible({ id }: Props) {
  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const { state } = useSandboxedTokenState(id, sandbox);

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // balance
  const balance = useMemo(() => {
    if (!state?.balances || !activeAddress) {
      return "0";
    }

    const bal = state.balances[activeAddress] || 0;

    return bal.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [state, activeAddress]);

  // router
  const [, setLocation] = useLocation();

  // load gateway
  const [tokens] = useTokens();
  const gateway = useMemo(() => {
    const token = tokens?.find((t) => t.id === id);

    if (!token?.gateway) {
      return defaultGateway;
    }

    return token.gateway;
  }, [tokens]);

  return (
    <Wrapper onClick={() => setLocation(`/collectible/${id}`)}>
      <Image src={concatGatewayURL(gateway) + `/${id}`}>
        <AnimatePresence>
          {state && balance !== "0" && (
            <OwnedQty
              variants={animation}
              initial="hidden"
              animate="shown"
              exit="hidden"
            >
              {balance}
            </OwnedQty>
          )}
        </AnimatePresence>
      </Image>
      <Spacer y={0.4} />
      <TokenName>
        {state?.name || state?.ticker || ""}
        <Ticker>{state?.ticker || ""}</Ticker>
      </TokenName>
      <iframe
        src={browser.runtime.getURL("tabs/sandbox.html")}
        ref={sandbox}
        style={{ display: "none" }}
      ></iframe>
    </Wrapper>
  );
}

const animation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const Wrapper = styled.div`
  cursor: pointer;
  transition: all 0.07s ease-in-out;

  &:active {
    transform: scale(0.97);
  }
`;

const Image = styled.div<{ src: string }>`
  position: relative;
  background-image: url(${(props) => props.src});
  background-size: cover;
  padding-top: 100%;
  border-radius: 18px;
`;

const TokenName = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  color: rgb(${(props) => props.theme.primaryText});
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  line-height: 1.2em;
`;

const Ticker = styled.span`
  color: rgb(${(props) => props.theme.secondaryText});
  text-transform: uppercase;
  font-size: 0.73em;
`;

const OwnedQty = styled(motion.div)`
  position: absolute;
  right: 0.6rem;
  bottom: 0.6rem;
  padding: 0.1rem 0.3rem;
  font-size: 0.8rem;
  border-radius: 1rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  backdrop-filter: blur(5px);
  padding: 0.1rem 0.55rem;
  width: max-content;
  text-align: center;
`;

interface Props {
  id: string;
}
