import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { DREContract, DRENode, NODES } from "@arconnect/warp-dre";
import { loadTokenLogo, type Token } from "~tokens/token";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { formatAddress } from "~utils/format";
import { getDreForToken } from "~tokens";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";
import * as viewblock from "~lib/viewblock";
import BaseListElement from "./BaseElement";
import styled from "styled-components";

export default function TokenListItem({ token, active }: Props) {
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

  useEffect(() => {
    (async () => {
      try {
        // if it is a collectible, we don't need to determinate the logo
        if (token.type === "collectible") {
          return setImage(
            `${concatGatewayURL(token.gateway || defaultGateway)}/${token.id}`
          );
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
  }, [token, theme]);

  // router
  const [, setLocation] = useLocation();

  return (
    <Reorder.Item
      as="div"
      value={token}
      id={token.id}
      dragListener={false}
      dragControls={dragControls}
      onClick={() => setLocation(`/tokens/${token.id}`)}
    >
      <BaseListElement
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
      </BaseListElement>
    </Reorder.Item>
  );
}

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
  active: boolean;
}
