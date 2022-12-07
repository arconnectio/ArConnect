import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { Card, DisplayTheme, Spacer } from "@arconnect/components";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useStorage } from "@plasmohq/storage/hook";
import { useMemo, useRef, useState } from "react";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Collectible({ id, size = "small" }: Props) {
  // display theme
  const theme = useTheme();

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

  // price
  const [price, setPrice] = useState<number>();

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
    <>
      <AnimatePresence>
        {state && (
          <Wrapper onClick={() => setLocation(`/collectible/${id}`)}>
            <CollectibleWrapper displayTheme={theme} size={size}>
              <ImageWrapper size={size}>
                <Image src={concatGatewayURL(gateway) + `/${id}`} />
              </ImageWrapper>
              <Spacer y={0.34} />
              <Data>
                <Title>{state.name || state.ticker}</Title>
                <SmallData>
                  <Balance>{`${balance} ${state.ticker}`}</Balance>
                  {price && (
                    <Balance>
                      {price}
                      <span>AR</span>
                    </Balance>
                  )}
                </SmallData>
              </Data>
            </CollectibleWrapper>
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

const sizes = {
  small: "128px",
  large: "160px"
};

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
  width: max-content;
`;

const CollectibleWrapper = styled(Card)<{
  displayTheme: DisplayTheme;
  size: "small" | "large";
}>`
  padding: 0;
  background-color: rgb(
    ${(props) =>
      props.displayTheme === "light" ? "0, 0, 0" : props.theme.cardBackground}
  );
  border: none;
  width: ${(props) => sizes[props.size]};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.07s ease-in-out;

  &:active {
    transform: scale(0.95);
  }
`;

const ImageWrapper = styled.div<{ size: "small" | "large" }>`
  position: relative;
  width: 100%;
  height: ${(props) => sizes[props.size]};
`;

const Image = styled.img.attrs({
  alt: "",
  draggable: false
})`
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
`;

const Data = styled.div`
  padding: 0.2rem 0.44rem 0.44rem;
`;

const SmallData = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.2rem;
`;

const Title = styled.p`
  font-size: 1.15rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  line-height: 1.05em;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
`;

const Balance = styled(Title)`
  display: flex;
  align-items: baseline;
  font-size: 0.82rem;
  color: rgb(${(props) => props.theme.theme});
  text-transform: uppercase;
  width: max-content;

  span {
    font-size: 0.68em;
  }
`;

interface Props {
  id: string;
  size?: "small" | "large";
}
