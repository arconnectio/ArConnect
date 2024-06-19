import {
  formatFiatBalance,
  formatTokenBalance,
  balanceToFractioned
} from "~tokens/currency";
import {
  type MouseEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { hoverEffect, useTheme } from "~utils/theme";
import { loadTokenLogo, type Token } from "~tokens/token";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { ButtonV2, Text, TooltipV2 } from "@arconnect/components";
import { getArPrice } from "~lib/coingecko";
import { usePrice } from "~lib/redstone";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import * as viewblock from "~lib/viewblock";
import Squircle from "~components/Squircle";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";
import { useGateway } from "~gateways/wayfinder";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { getUserAvatar } from "~lib/avatar";
import { abbreviateNumber } from "~utils/format";
import Skeleton from "~components/Skeleton";
import { TrashIcon, PlusIcon, SettingsIcon } from "@iconicicons/react";
import BigNumber from "bignumber.js";
import JSConfetti from "js-confetti";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";

export default function Token({ onClick, ...props }: Props) {
  const ref = useRef(null);
  const [totalBalance, setTotalBalance] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [aoConfettiShown, setAoConfettiShown] = useState(true);
  // display theme
  const theme = useTheme();

  const [activeAddress] = useStorage({
    key: "active_address",
    instance: ExtensionStorage
  });

  const arweaveLogo = useMemo(
    () => (theme === "dark" ? arLogoDark : arLogoLight),
    [theme]
  );

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
    const balanceToFormat = BigNumber(props.ao ? props.balance : fractBalance);
    const isTinyBalance = balanceToFormat.gt(0) && balanceToFormat.lt(1e-6);
    const isSmallBalance = balanceToFormat.lt(1) && balanceToFormat.gte(1e-6);

    const formattedBalance =
      isTinyBalance || isSmallBalance
        ? balanceToFormat.toFixed()
        : formatTokenBalance(balanceToFormat);

    setTotalBalance(balanceToFormat.toFixed());

    setShowTooltip(balanceToFormat.gte(1_000_000) || isTinyBalance);

    return isSmallBalance
      ? formattedBalance
      : abbreviateNumber(balanceToFormat);
  }, [fractBalance.toString()]);

  // token price
  const { price, currency } = usePrice(props.ticker);

  // fiat balance
  const fiatBalance = useMemo(() => {
    if (!price) return <div />;

    const estimate = fractBalance.multipliedBy(price);

    return formatFiatBalance(estimate, currency.toLowerCase());
  }, [price, balance, currency]);

  // token logo
  const [logo, setLogo] = useState<string>();

  const hasActionButton =
    props?.onAddClick || props?.onRemoveClick || props?.onSettingsClick;

  const triggerConfetti = async () => {
    const jsConfetti = new JSConfetti({ canvas: ref.current });
    jsConfetti.addConfetti();
    setAoConfettiShown(true);
    await ExtensionStorage.set(`ao_confetti_shown_${activeAddress}`, true);
  };

  useEffect(() => {
    (async () => {
      if (!props?.id || logo) return;
      if (!props?.ao) {
        setLogo(viewblock.getTokenLogo(props.id));
        setLogo(await loadTokenLogo(props.id, props.defaultLogo, theme));
      } else {
        if (props.defaultLogo) {
          const logo = await getUserAvatar(props.defaultLogo);
          setLogo(logo);
        } else {
          setLogo(arweaveLogo);
        }
      }
    })();
  }, [props, theme, logo, arweaveLogo]);

  useEffect(() => {
    if (props?.ao && !props.defaultLogo) {
      setLogo(arweaveLogo);
    }
  }, [arweaveLogo]);

  useEffect(() => {
    if (activeAddress && AO_NATIVE_TOKEN === props.id) {
      ExtensionStorage.get<boolean>(`ao_confetti_shown_${activeAddress}`).then(
        setAoConfettiShown
      );
    }
  }, [AO_NATIVE_TOKEN, props.id, activeAddress]);

  useEffect(() => {
    if (
      ref.current &&
      activeAddress &&
      !props.loading &&
      AO_NATIVE_TOKEN === props.id &&
      !aoConfettiShown &&
      +props.balance > 0
    ) {
      triggerConfetti();
    }
  }, [
    ref.current,
    aoConfettiShown,
    activeAddress,
    props.balance,
    props.loading
  ]);

  return (
    <Wrapper>
      {(!aoConfettiShown || ref.current) &&
        AO_NATIVE_TOKEN === props.id &&
        +props.balance > 0 && <Canvas ref={ref} />}
      <InnerWrapper width={hasActionButton ? "86%" : "100%"} onClick={onClick}>
        <LogoAndDetails>
          <LogoWrapper>
            <Logo src={logo || ""} alt="" key={props.id} />
          </LogoWrapper>
          <TokenName>{props.name || props.ticker || "???"}</TokenName>
          {props?.ao && <Image src={aoLogo} alt="ao logo" />}
        </LogoAndDetails>

        <BalanceSection>
          {props?.loading ? (
            <Skeleton width="80px" height="20px" />
          ) : props?.error ? (
            <TooltipV2 content={DegradedMessage} position="left">
              <WarningIcon />
            </TooltipV2>
          ) : (
            <>
              {showTooltip ? (
                <BalanceTooltip content={totalBalance} position="topEnd">
                  <NativeBalance>{balance}</NativeBalance>
                </BalanceTooltip>
              ) : (
                <NativeBalance>{balance}</NativeBalance>
              )}
            </>
          )}

          <FiatBalance>{fiatBalance}</FiatBalance>
        </BalanceSection>
      </InnerWrapper>
      {hasActionButton && (
        <div style={{ zIndex: 1 }}>
          {props?.onAddClick ? (
            <ButtonV2
              fullWidth
              onClick={props.onAddClick}
              style={{ padding: 0, minWidth: 40, maxWidth: 40 }}
            >
              <PlusIcon />
            </ButtonV2>
          ) : props?.onSettingsClick ? (
            <ButtonV2
              fullWidth
              onClick={props.onSettingsClick}
              style={{ padding: 0, minWidth: 40, maxWidth: 40 }}
            >
              <SettingsIcon />
            </ButtonV2>
          ) : (
            props?.onRemoveClick && (
              <ButtonV2
                fullWidth
                onClick={props.onRemoveClick}
                style={{ padding: 0, minWidth: 40, maxWidth: 40 }}
              >
                <TrashIcon />
              </ButtonV2>
            )
          )}
        </div>
      )}
    </Wrapper>
  );
}

const DegradedMessage: React.ReactNode = (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "14px" }}>ao token process network degraded.</div>
    <div style={{ fontSize: "12px", color: "#a3a3a3" }}>
      ao token process will be available when <br />
      the network issues are resolved.
    </div>
  </div>
);

export const WarningIcon = ({ color }: { color?: string }) => {
  return (
    <svg
      width="23"
      height="22"
      viewBox="0 0 23 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5 7V11M11.5 15H11.51M21.5 11C21.5 16.5228 17.0228 21 11.5 21C5.97715 21 1.5 16.5228 1.5 11C1.5 5.47715 5.97715 1 11.5 1C17.0228 1 21.5 5.47715 21.5 11Z"
        stroke={color || "#FF1A1A"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Wrapper = styled.div`
  position: relative;
  width: 100%;
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

const InnerWrapper = styled.div<{ width: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: ${(props) => props.width};
`;

const BalanceTooltip = styled(TooltipV2)`
  margin-right: 1rem;
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
  width: min-content;
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

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

interface Props extends Token {
  ao?: boolean;
  loading?: boolean;
  error?: boolean;
  onAddClick?: MouseEventHandler<HTMLButtonElement>;
  onRemoveClick?: MouseEventHandler<HTMLButtonElement>;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
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
  const [balance, setBalance] = useState(BigNumber("0"));
  const [fiatBalance, setFiatBalance] = useState(BigNumber("0"));

  // memoized requirements to ensure stability
  const requirements = useMemo(() => ({ ensureStake: true }), []);
  const gateway = useGateway(requirements);

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const arweave = new Arweave(gateway);

      // fetch balance
      const winstonBalance = await arweave.wallets.getBalance(activeAddress);
      const arBalance = BigNumber(arweave.ar.winstonToAr(winstonBalance));

      setBalance(arBalance);
    })();
  }, [activeAddress, gateway]);

  useEffect(() => {
    setFiatBalance(balance.multipliedBy(price));
  }, [balance, price]);

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
          {formatTokenBalance(balance)}
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
