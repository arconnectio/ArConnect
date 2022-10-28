import { Token as TokenInterface } from "~utils/token";
import { Text } from "@arconnect/components";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";
import styled from "styled-components";

export default function Token({ id, name, ticker, price, balance }: Props) {
  // display theme
  const theme = useTheme();

  // router
  const [, setLocation] = useLocation();

  return (
    <Wrapper onClick={() => setLocation(`/token/${id}`)}>
      <LogoAndDetails>
        <Logo src={`https://meta.viewblock.io/AR.${id}/logo?t=${theme}`} />
        <div>
          <PrimaryText>
            {name ? name + ` (${ticker.toUpperCase()})` : ticker.toUpperCase()}
          </PrimaryText>
          <Ticker>
            {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            {ticker}
          </Ticker>
        </div>
      </LogoAndDetails>
      {price && <PrimaryText>{price}</PrimaryText>}
    </Wrapper>
  );
}

const Wrapper = styled.div`
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

interface Props extends TokenInterface {
  price?: number;
}
