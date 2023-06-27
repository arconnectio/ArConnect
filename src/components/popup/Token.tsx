import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { defaultGateway } from "~applications/gateway";
import { hoverEffect, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { Text } from "@arconnect/components";
import { getArPrice } from "~lib/coingecko";
import { usePrice } from "~lib/redstone";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import Squircle from "~components/Squircle";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Token({ onClick, ...props }: Props) {
  // display theme
  const theme = useTheme();

  // token balance
  const balance = useMemo(
    () => props.balance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    [props]
  );

  // token price
  const { price, currency } = usePrice(props.ticker);

  // fiat balance
  const fiatBalance = useMemo(() => {
    if (!price) return undefined;

    return props.balance * price;
  }, [price, balance]);

  return (
    <Wrapper onClick={onClick}>
      <LogoAndDetails>
        <LogoWrapper>
          <Logo
            src={`https://meta.viewblock.io/AR.${props.id}/logo?t=${theme}`}
          />
        </LogoWrapper>
        <TokenName>
          {(props.name && (
            <>
              {props.name}
              <span>{props.ticker}</span>
            </>
          )) ||
            props.ticker}
        </TokenName>
      </LogoAndDetails>
      <BalanceSection>
        <FiatBalance>
          {(typeof fiatBalance !== "undefined" &&
            fiatBalance.toLocaleString(undefined, {
              style: "currency",
              currency: currency.toLowerCase(),
              currencyDisplay: "narrowSymbol",
              maximumFractionDigits: 2
            })) ||
            "--"}
        </FiatBalance>
        <NativeBalance>
          {balance} {props.ticker}
        </NativeBalance>
      </BalanceSection>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.07s ease-in-out;

  ${hoverEffect}

  &::after {
    width: 105%;
    height: 130%;
    border-radius: 12px;
  }

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

const LogoWrapper = styled(Squircle)`
  position: relative;
  width: 3rem;
  height: 3rem;
  color: rgba(${(props) => props.theme.theme}, 0.2);
`;

const Logo = styled.div<{ src: string }>`
  position: absolute;
  mask: url(${(props) => props.src}) center/contain;
  -webkit-mask: url(${(props) => props.src}) center/contain;
  user-select: none;
  background: rgb(${(props) => props.theme.theme});
  width: 35%;
  height: 35%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const TokenName = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  font-size: 1.1rem;
  color: rgb(${(props) => props.theme.primaryText});

  span {
    color: rgba(${(props) => props.theme.secondaryText}, 0.8);
    font-weight: 400;
  }
`;

const FiatBalance = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.98rem;
  font-weight: 400;
  color: rgb(${(props) => props.theme.primaryText});
`;

const NativeBalance = styled.span`
  font-size: 0.75rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 400;
`;

const BalanceSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: right;

  p,
  span {
    text-align: right;
  }
`;

interface Props {
  id: string;
  name?: string;
  balance: number;
  ticker: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function ArToken({ onClick }: ArTokenProps) {
  // currency setting
  const [currency] = useSetting<string>("currency");

  // load arweave price
  const [price, setPrice] = useState(0);

  useEffect(() => {
    getArPrice(currency)
      .then((v) => setPrice(v))
      .catch();
  }, [currency]);

  // theme
  const theme = useTheme();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // load ar balance
  const [balance, setBalance] = useState("0");
  const [fiatBalance, setFiatBalance] = useState(0);

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const arweave = new Arweave(defaultGateway);

      // fetch balance
      const winstonBalance = await arweave.wallets.getBalance(activeAddress);
      const arBalance = Number(arweave.ar.winstonToAr(winstonBalance));

      setBalance(
        arBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })
      );
      setFiatBalance(arBalance * price);
    })();
  }, [activeAddress, price]);

  return (
    <Wrapper onClick={onClick}>
      <LogoAndDetails>
        <LogoWrapper>
          <Logo src={theme === "light" ? arLogoLight : arLogoDark} />
        </LogoWrapper>
        <TokenName>
          Arweave
          <span>AR</span>
        </TokenName>
      </LogoAndDetails>
      <BalanceSection>
        <FiatBalance>
          {fiatBalance.toLocaleString(undefined, {
            style: "currency",
            currency: currency.toLowerCase(),
            currencyDisplay: "narrowSymbol",
            maximumFractionDigits: 2
          })}
        </FiatBalance>
        <NativeBalance>
          {balance}
          {" AR"}
        </NativeBalance>
      </BalanceSection>
    </Wrapper>
  );
}

interface ArTokenProps {
  onClick?: MouseEventHandler<HTMLDivElement>;
}
