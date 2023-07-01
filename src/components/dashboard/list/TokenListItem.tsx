import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { loadTokenLogo, Token } from "~tokens/token";
import { formatAddress } from "~utils/format";
import { getContract } from "~lib/warp";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";
import * as viewblock from "~lib/viewblock";
import BaseElement from "./BaseElement";
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
        // query community logo using Warp DRE
        const { result } = await getContract<string>(token.id, {
          query: "$.settings.[?(@[0] === 'communityLogo')][1]"
        });

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
