import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { MouseEventHandler, useMemo, useRef } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { hoverEffect } from "~utils/theme";
import { useTokens } from "~tokens";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Collectible({ id, onClick }: Props) {
  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const { state } = useSandboxedTokenState(id, sandbox, 270);

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
    <Wrapper onClick={onClick}>
      <Image src={concatGatewayURL(gateway) + `/${id}`}>
        <NameAndQty>
          <Name>{state?.name || ""}</Name>
          <Qty>{balance}</Qty>
        </NameAndQty>
      </Image>
      <iframe
        src={browser.runtime.getURL("tabs/sandbox.html")}
        ref={sandbox}
        style={{ display: "none" }}
      ></iframe>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  cursor: pointer;
  transition: all 0.07s ease-in-out;

  ${hoverEffect}

  &::after {
    width: calc(100% + 15px);
    height: calc(100% + 15px);
    border-radius: 19.5px;
  }

  &:active {
    transform: scale(0.97);
  }
`;

const Image = styled.div<{ src: string }>`
  position: relative;
  background-image: url(${(props) => props.src});
  background-size: cover;
  padding-top: 100%;
  border-radius: 12px;
`;

const NameAndQty = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  left: 0.35rem;
  bottom: 0.35rem;
  padding: 0.1rem 0.35rem;
  // padding * 2 + left + right
  max-width: calc(100% - 0.35rem * 2 - 0.55rem * 2);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
`;

const Name = styled.span`
  font-size: 0.9rem;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Qty = styled(Name)`
  color: #a0a0a0;
`;

interface Props {
  id: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}
