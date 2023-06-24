import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { defaultGateway } from "~applications/gateway";
import { hoverEffect, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import type { TokenState } from "~tokens/token";
import { Text } from "@arconnect/components";
import { getArPrice } from "~lib/coingecko";
import { usePrice } from "~lib/redstone";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import Squircle from "~components/Squircle";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Token({ id, onClick }: Props) {
  // display theme
  const theme = useTheme();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // load state
  const [state, setState] = useState<TokenState>();

  useEffect(() => {
    (async () => {
      const res = await (
        await fetch(`https://dre-1.warp.cc/contract?id=${id}&validity=true`)
      ).json();

      setState(res.state);
    })();
  }, [id]);

  // token balance
  const balance = useMemo(() => {
    if (!state?.balances || !activeAddress) {
      return 0;
    }

    const bal = state.balances[activeAddress] || 0;

    return bal;
  }, [state, activeAddress]);

  // formatted token balance
  const formattedBalance = useMemo(
    () => balance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    [balance]
  );

  // token price
  const { price } = usePrice(state?.ticker);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // fiat balance
  const fiatBalance = useMemo(() => {
    if (!price) return undefined;

    return balance * price;
  }, [price, balance]);

  return (
    <>
      <AnimatePresence>
        {state && (
          <Wrapper onClick={onClick}>
            <LogoAndDetails>
              <LogoWrapper>
                <Logo
                  src={`https://meta.viewblock.io/AR.${id}/logo?t=${theme}`}
                />
              </LogoWrapper>
              <TokenName>
                {(state.name && (
                  <>
                    {state.name}
                    <span>{state.ticker}</span>
                  </>
                )) ||
                  state.ticker}
              </TokenName>
            </LogoAndDetails>
            <BalanceSection>
              <FiatBalance>
                {(fiatBalance &&
                  fiatBalance.toLocaleString(undefined, {
                    style: "currency",
                    currency: currency.toLowerCase(),
                    currencyDisplay: "narrowSymbol",
                    maximumFractionDigits: 2
                  })) ||
                  "--"}
              </FiatBalance>
              <NativeBalance>
                {formattedBalance} {state.ticker}
              </NativeBalance>
            </BalanceSection>
          </Wrapper>
        )}
      </AnimatePresence>
    </>
  );
}

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
