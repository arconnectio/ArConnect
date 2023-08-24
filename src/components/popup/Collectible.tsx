import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { type MouseEventHandler, useMemo } from "react";
import { formatTokenBalance, balanceToFractioned } from "~tokens/currency";
import { hoverEffect } from "~utils/theme";
import styled from "styled-components";

export default function Collectible({ id, onClick, ...props }: Props) {
  // balance
  const balance = useMemo(
    () =>
      formatTokenBalance(
        balanceToFractioned(props.balance, {
          id,
          decimals: props.decimals,
          divisibility: props.divisibility
        })
      ),
    [props, id]
  );

  return (
    <Wrapper onClick={onClick}>
      <Image src={concatGatewayURL(defaultGateway) + `/${id}`}>
        <NameAndQty>
          <Name>{props.name || ""}</Name>
          <Qty>{balance}</Qty>
        </NameAndQty>
      </Image>
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
  // 100 % - padding * 2 + left + right
  max-width: calc(100% - 0.35rem * 2 - 0.55rem * 2);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
`;

const Name = styled.span`
  font-size: 0.85rem;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Qty = styled(Name)`
  color: #a0a0a0;
`;

interface Props {
  id: string;
  name: string;
  balance: number;
  divisibility?: number;
  decimals?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
}
