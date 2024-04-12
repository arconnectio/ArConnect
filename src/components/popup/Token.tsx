import {
  formatFiatBalance,
  formatTokenBalance,
  balanceToFractioned
} from "~tokens/currency";
import { type MouseEventHandler, useEffect, useMemo, useState } from "react";
import { hoverEffect, useTheme } from "~utils/theme";
import { loadTokenLogo, type Token } from "~tokens/token";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { Text, TooltipV2 } from "@arconnect/components";
import { getArPrice } from "~lib/coingecko";
import { usePrice } from "~lib/redstone";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import * as viewblock from "~lib/viewblock";
import Squircle from "~components/Squircle";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { useGateway } from "~gateways/wayfinder";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { getUserAvatar } from "~lib/avatar";
import { abbreviateNumber } from "~utils/format";

export default function Token({ onClick, ...props }: Props) {
  const [totalBalance, setTotalBalance] = useState("");
  // display theme
  const theme = useTheme();

  // token balance
  const fractBalance = useMemo(
    () =>
      balanceToFractioned(props.balance, {
        id: props.id,
        decimals: props.decimals,
        divisibility: props.divisibility
      }),
    [props]
  );

  const balance = useMemo(() => {
    const formattedBalance = formatTokenBalance(fractBalance);
    setTotalBalance(formattedBalance);
    const numBalance = parseFloat(formattedBalance.replace(/,/g, ""));
    return abbreviateNumber(numBalance);
  }, [fractBalance]);

  // token price
  const { price, currency } = usePrice(props.ticker);

  // fiat balance
  const fiatBalance = useMemo(() => {
    if (!price) return <div />;

    const estimate = fractBalance * price;

    return formatFiatBalance(estimate, currency.toLowerCase());
  }, [price, balance, currency]);

  // token logo
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!props?.id || logo) return;
      if (!props?.ao) {
        setLogo(viewblock.getTokenLogo(props.id));
        setLogo(await loadTokenLogo(props.id, props.defaultLogo, theme));
      } else {
        const logo = await getUserAvatar(props.defaultLogo);
        setLogo(logo);
      }
    })();
  }, [props, theme, logo]);

  useEffect(() => {
    console.log("balance:", balance);
  }, [balance]);

  return (
    <Wrapper onClick={onClick}>
      <LogoAndDetails>
        <LogoWrapper>
          <Logo src={logo || ""} alt="" key={props.id} />
        </LogoWrapper>
        <TokenName>{props.name || props.ticker || "???"}</TokenName>
        {props?.ao && <Image src={aoLogo} alt="ao logo" />}
      </LogoAndDetails>
      <BalanceSection>
        <TooltipV2 content={`${totalBalance} ${props.ticker}`} position="left">
          <NativeBalance>
            {balance} {props.ticker}
          </NativeBalance>
        </TooltipV2>
        <FiatBalance>{fiatBalance}</FiatBalance>
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

  &:active {
    transform: scale(0.98);
  }
`;

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

export const LogoAndDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

export const LogoWrapper = styled(Squircle)<{ small?: boolean }>`
  position: relative;
  width: ${(props) => (props.small ? "2.1875rem" : "2.8rem;")};
  height: ${(props) => (props.small ? "2.1875rem" : "2.8rem;")};
  flex-shrink: 0;
  color: rgba(${(props) => props.theme.theme}, 0.2);
`;

export const Logo = styled.img.attrs({
  draggable: false
})`
  position: absolute;
  user-select: none;
  width: 55%;
  height: 55%;
  top: 50%;
  left: 50%;
  object-fit: contain;
  transform: translate(-50%, -50%);
`;

export const TokenName = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.34rem;
  font-size: 1rem;
  color: rgb(${(props) => props.theme.primaryText});
`;

const NativeBalance = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(${(props) => props.theme.primaryText}, 0.83);
`;

const FiatBalance = styled.span<{ ao?: boolean }>`
  font-size: 0.75rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 400;
`;

const BalanceSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: right;
  flex-shrink: 0;

  p,
  span {
    text-align: right;
  }
`;

interface Props extends Token {
  ao?: boolean;
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
  const gateway = useGateway({ ensureStake: true });

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const arweave = new Arweave(gateway);

      // fetch balance
      const winstonBalance = await arweave.wallets.getBalance(activeAddress);
      const arBalance = Number(arweave.ar.winstonToAr(winstonBalance));

      setBalance(formatTokenBalance(arBalance));
      setFiatBalance(arBalance * price);
    })();
  }, [activeAddress, price, gateway]);

  return (
    <Wrapper onClick={onClick}>
      <LogoAndDetails>
        <LogoWrapper>
          <Logo src={theme === "light" ? arLogoLight : arLogoDark} />
        </LogoWrapper>
        <TokenName>Arweave</TokenName>
      </LogoAndDetails>
      <BalanceSection>
        <NativeBalance>
          {balance}
          {" AR"}
        </NativeBalance>
        <FiatBalance>
          {formatFiatBalance(fiatBalance, currency.toLowerCase())}
        </FiatBalance>
      </BalanceSection>
    </Wrapper>
  );
}

interface ArTokenProps {
  onClick?: MouseEventHandler<HTMLDivElement>;
}
