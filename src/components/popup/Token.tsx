import { MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { defaultGateway } from "~applications/gateway";
import { hoverEffect, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { Text } from "@arconnect/components";
import { getArPrice } from "~lib/coingecko";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import useSandboxedTokenState from "~tokens/hook";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Token({ id, onClick }: Props) {
  // display theme
  const theme = useTheme();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const { state } = useSandboxedTokenState(id, sandbox, 270);

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
  const [price, setPrice] = useState<number>();

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
              <LogoWrapper outline="#000">
                <Logo
                  src={`https://meta.viewblock.io/AR.${id}/logo?t=${theme}`}
                />
              </LogoWrapper>
              <div>
                <PrimaryText>{state.name || state.ticker}</PrimaryText>
                <Ticker>
                  {formattedBalance} {state.ticker}
                </Ticker>
              </div>
            </LogoAndDetails>
            {(price && fiatBalance && (
              <FiatSection>
                <PrimaryText>
                  {price.toLocaleString(undefined, {
                    style: "currency",
                    currency: currency.toLowerCase(),
                    currencyDisplay: "narrowSymbol",
                    maximumFractionDigits: 2
                  })}
                </PrimaryText>
                <Ticker>
                  {fiatBalance.toLocaleString(undefined, {
                    style: "currency",
                    currency: currency.toLowerCase(),
                    currencyDisplay: "narrowSymbol",
                    maximumFractionDigits: 2
                  })}
                </Ticker>
              </FiatSection>
            )) ||
              ""}
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
  color: transparent;

  path {
    stroke: rgb(${(props) => props.theme.cardBorder}) !important;
  }
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

const FiatSection = styled.div`
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
    area: "local",
    isSecret: true
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
        <LogoWrapper outline="#000">
          <Logo src={theme === "light" ? arLogoLight : arLogoDark} />
        </LogoWrapper>
        <div>
          <PrimaryText>Arweave</PrimaryText>
          <Ticker>
            {balance}
            {" AR"}
          </Ticker>
        </div>
      </LogoAndDetails>
      <FiatSection>
        <PrimaryText>
          {price.toLocaleString(undefined, {
            style: "currency",
            currency: currency.toLowerCase(),
            currencyDisplay: "narrowSymbol",
            maximumFractionDigits: 2
          })}
        </PrimaryText>
        <Ticker>
          {fiatBalance.toLocaleString(undefined, {
            style: "currency",
            currency: currency.toLowerCase(),
            currencyDisplay: "narrowSymbol",
            maximumFractionDigits: 2
          })}
        </Ticker>
      </FiatSection>
    </Wrapper>
  );
}

interface ArTokenProps {
  onClick?: MouseEventHandler<HTMLDivElement>;
}