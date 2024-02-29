import { DREContract, DRENode, NODES } from "@arconnect/warp-dre";
import { loadTokenLogo, type Token } from "~tokens/token";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { formatAddress } from "~utils/format";
import { getDreForToken } from "~tokens";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";
import * as viewblock from "~lib/viewblock";
import BaseElement from "./BaseElement";
import styled from "styled-components";
import { useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { getUserAvatar } from "~lib/avatar";

export default function TokenListItem({ token, active, ao }: Props) {
  // format address
  const formattedAddress = useMemo(
    () => formatAddress(token.id, 8),
    [token.id]
  );

  // allow dragging with the drag icon
  const dragControls = useDragControls();

  // display theme
  const theme = useTheme();

  // token logo
  const [image, setImage] = useState(viewblock.getTokenLogo(token.id));

  // gateway
  const gateway = useGateway({ startBlock: 0 });

  useEffect(() => {
    (async () => {
      try {
        // if it is a collectible, we don't need to determinate the logo
        if (token.type === "collectible") {
          return setImage(
            `${concatGatewayURL(token.gateway || gateway)}/${token.id}`
          );
        }
        if (ao) {
          const logo = await getUserAvatar(token.defaultLogo);
          return setImage(logo);
        }

        // query community logo using Warp DRE
        const node = new DRENode(await getDreForToken(token.id));
        const contract = new DREContract(token.id, node);
        const result = await contract.query<[string]>(
          "$.settings.[?(@[0] === 'communityLogo')][1]"
        );

        setImage(await loadTokenLogo(token.id, result[0], theme));
      } catch {
        setImage(viewblock.getTokenLogo(token.id));
      }
    })();
  }, [token, theme, gateway]);

  // router
  const [, setLocation] = useLocation();

  return ao ? (
    <BaseElement
      ao={true}
      title={`${token.name} (${token.ticker})`}
      description={
        <div style={{ display: "flex", gap: "8px" }}>
          {formattedAddress}
          <Image src={aoLogo} alt="ao logo" />
        </div>
      }
      active={active}
    >
      <TokenLogo src={image} />
    </BaseElement>
  ) : (
    <Reorder.Item
      as="div"
      value={token}
      id={token.id}
      dragListener={false}
      dragControls={dragControls}
      onClick={() => setLocation(`/tokens/${token.id}`)}
    >
      <BaseElement
        title={`${token.name} (${token.ticker})`}
        description={
          <>
            {formattedAddress}
            <TokenType>{token.type}</TokenType>
          </>
        }
        active={active}
        dragControls={dragControls}
      >
        <TokenLogo src={image} />
      </BaseElement>
    </Reorder.Item>
  );
}

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const TokenLogo = styled.img.attrs({
  alt: "token-logo",
  draggable: false
})`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.7rem;
  height: 1.7rem;
  user-select: none;
  transform: translate(-50%, -50%);
`;

const TokenType = styled.span`
  padding: 0.08rem 0.2rem;
  background-color: rgb(${(props) => props.theme.theme});
  color: #fff;
  font-weight: 500;
  font-size: 0.62rem;
  text-transform: uppercase;
  margin-left: 0.45rem;
  width: max-content;
  border-radius: 5px;
`;

interface Props {
  token: Token;
  ao?: boolean;
  active: boolean;
}
