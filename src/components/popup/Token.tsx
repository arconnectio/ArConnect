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
import { formatBalance } from "~utils/format";
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
      props.ao
        ? BigNumber(props.balance)
        : balanceToFractioned(props.balance, {
            id: props.id,
            decimals: props.decimals,
            divisibility: props.divisibility
          }),
    [props]
  );

  const balance = useMemo(() => {
    const formattedBalance = formatBalance(fractBalance);
    setTotalBalance(formattedBalance.tooltipBalance);
    setShowTooltip(formattedBalance.showTooltip);
    return formattedBalance.displayBalance;
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
          ) : props?.networkError ? (
            <TooltipV2 content={NetworkErrorMessage} position="left">
              <NetworkErrorIcon />
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

const NetworkErrorMessage: React.ReactNode = (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "14px" }}>Network issue detected.</div>
    <div style={{ fontSize: "12px", color: "#a3a3a3" }}>
      Your ISP or VPN is blocking access to AO.
      <br />
      Please use a different connection.
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

export const NetworkErrorIcon = ({ color }: { color?: string }) => {
  return (
    <svg
      version="1.0"
      width="20"
      height="20"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(0,512) scale(0.1,-0.1)"
        fill={color || "#FF1A1A"}
        stroke="none"
      >
        <path
          d="M2450 5114 c-635 -40 -1197 -284 -1640 -711 -142 -137 -231 -240
-335 -388 -221 -315 -359 -657 -426 -1049 -27 -155 -36 -484 -20 -652 73 -722
451 -1382 1043 -1818 218 -160 504 -302 771 -382 81 -24 273 -68 343 -78 l41
-6 17 128 c15 115 20 132 52 181 l36 53 -24 16 c-50 35 -154 141 -208 214
-108 144 -201 327 -275 540 -19 55 -35 104 -35 109 0 5 100 9 230 9 l230 0 0
160 0 160 -275 0 c-151 0 -275 1 -275 3 0 2 -11 68 -24 148 -28 162 -51 368
-62 537 l-7 112 322 0 321 0 0 160 0 160 -321 0 -322 0 7 113 c11 169 34 376
62 534 13 78 24 145 24 148 0 3 162 5 360 5 l360 0 0 -320 0 -320 155 0 155 0
0 320 0 320 354 0 355 0 10 -52 c33 -165 71 -452 71 -540 l0 -48 48 0 c26 0
97 3 157 6 l110 7 -3 41 c-8 113 -36 353 -53 451 -10 61 -19 116 -19 123 0 9
91 12 420 12 l419 0 21 -47 c69 -156 128 -350 159 -518 l16 -90 153 19 153 20
-7 45 c-12 94 -57 280 -95 398 -128 396 -341 736 -647 1035 -472 461 -1057
710 -1717 731 -71 2 -155 3 -185 1z m-30 -809 l0 -465 -315 0 c-173 0 -315 1
-315 3 0 2 13 41 29 88 126 369 325 673 522 798 35 23 67 41 72 41 4 0 7 -209
7 -465z m403 415 c196 -131 360 -386 498 -772 l39 -108 -315 0 -315 0 0 465
c0 275 4 465 9 465 5 0 43 -23 84 -50z m-1032 -129 c-110 -167 -241 -456 -302
-664 -12 -44 -27 -81 -33 -83 -6 -2 -172 -3 -368 -2 l-358 3 74 96 c199 257
517 515 793 641 101 46 226 97 240 98 7 0 -14 -40 -46 -89z m1649 37 c262
-110 511 -278 720 -488 87 -87 218 -240 241 -282 9 -17 -11 -18 -354 -18
l-364 0 -47 141 c-82 245 -168 430 -282 607 -30 45 -54 85 -54 88 0 8 34 -4
140 -48z m-2077 -1240 c-25 -154 -49 -370 -59 -545 l-7 -123 -484 0 -483 0 4
23 c3 12 8 51 11 87 16 173 91 451 165 618 l33 72 421 0 422 0 -23 -132z m-55
-1169 c13 -182 40 -415 65 -548 l14 -71 -423 0 -422 0 -33 78 c-92 220 -145
429 -172 680 l-5 42 482 0 482 0 12 -181z m176 -1006 c58 -207 206 -536 310
-691 30 -45 53 -82 50 -82 -2 0 -45 16 -95 35 -196 76 -417 205 -594 348 -104
84 -284 270 -363 375 l-63 82 368 0 368 0 19 -67z"
        />
        <path
          d="M3722 2549 c-302 -22 -585 -157 -807 -383 -179 -183 -304 -430 -347
-690 -18 -103 -14 -334 7 -431 67 -320 236 -592 483 -777 234 -177 479 -259
772 -259 350 0 654 127 902 378 245 248 368 549 368 898 0 266 -82 522 -236
735 -110 154 -304 320 -470 403 -190 96 -441 143 -672 126z m342 -333 c229
-64 434 -206 555 -385 57 -84 116 -212 143 -308 32 -114 31 -372 0 -488 -48
-174 -170 -371 -297 -479 -190 -161 -394 -236 -641 -236 -190 0 -343 43 -500
139 -407 251 -567 754 -382 1199 118 283 379 498 688 567 88 20 351 14 434 -9z"
        />
        <path
          d="M3427 1673 l-107 -108 142 -142 143 -143 -143 -143 -142 -142 110
-110 110 -110 143 143 142 142 140 -140 c77 -77 144 -140 150 -140 6 0 57 47
115 105 l105 105 -145 145 -145 145 145 145 145 145 -105 105 c-58 58 -109
105 -115 105 -5 0 -73 -63 -150 -140 l-140 -140 -140 140 c-77 77 -142 140
-145 140 -3 0 -53 -48 -113 -107z"
        />
      </g>
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
  networkError?: boolean;
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
  const [displayBalance, setDisplayBalance] = useState("0");
  const [totalBalance, setTotalBalance] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

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

      const formattedBalance = formatBalance(arBalance);
      setTotalBalance(formattedBalance.tooltipBalance);
      setShowTooltip(formattedBalance.showTooltip);
      setDisplayBalance(formattedBalance.displayBalance);
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
      {showTooltip ? (
        <BalanceSection>
          <BalanceTooltip content={totalBalance} position="topEnd">
            <NativeBalance>
              {displayBalance}
              {" AR"}
            </NativeBalance>
          </BalanceTooltip>
          <FiatBalance>
            {formatFiatBalance(fiatBalance, currency.toLowerCase())}
          </FiatBalance>
        </BalanceSection>
      ) : (
        <BalanceSection>
          <NativeBalance>
            {displayBalance}
            {" AR"}
          </NativeBalance>
          <FiatBalance>
            {formatFiatBalance(fiatBalance, currency.toLowerCase())}
          </FiatBalance>
        </BalanceSection>
      )}
    </Wrapper>
  );
}

interface ArTokenProps {
  onClick?: MouseEventHandler<HTMLDivElement>;
}
