import { PageType, trackPage } from "~utils/analytics";
import { useState, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";
import {
  Button,
  Input,
  Section,
  Spacer,
  Text,
  Tooltip,
  useInput
} from "@arconnect/components";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import * as viewblock from "~lib/viewblock";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RefreshIcon
} from "@iconicicons/react";
import Token, {
  ArToken,
  Logo,
  LogoAndDetails,
  LogoWrapper,
  TokenName
} from "~components/popup/Token";
import useSetting from "~settings/hook";
import {
  balanceToFractioned,
  formatFiatBalance,
  formatTokenBalance,
  fractionedToBalance,
  getCurrencySymbol
} from "~tokens/currency";
import { useStorage } from "@plasmohq/storage/hook";
import {
  ExtensionStorage,
  TRANSFER_TX_STORAGE,
  TempTransactionStorage
} from "~utils/storage";
import { getDreForToken, useTokens } from "~tokens";
import { loadTokenLogo, type Token as TokenInterface } from "~tokens/token";
import { useTheme } from "~utils/theme";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import Arweave from "arweave";
import { useBalance } from "~wallets/hooks";
import { getPrice } from "~lib/coingecko";
import redstone from "redstone-api";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Collectible from "~components/popup/Collectible";
import { findGateway } from "~gateways/wayfinder";
import { useHistory } from "~utils/hash_router";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import { isUToken } from "~utils/send";
import HeadV2 from "~components/popup/HeadV2";

// default size for the qty text
const defaulQtytSize = 3.7;
const arPlaceholder: TokenInterface = {
  id: "AR",
  name: "Arweave",
  ticker: "AR",
  type: "asset",
  balance: 0,
  decimals: 12
};

export default function Send({ id }: Props) {
  // Segment
  useEffect(() => {
    trackPage(PageType.SEND);
  }, []);

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // quantity
  const [qty, setQty] = useStorage<string>(
    {
      key: "last_send_qty",
      instance: ExtensionStorage
    },
    ""
  );

  // currency setting
  const [currency] = useSetting<string>("currency");

  // qty mode (fiat/token)
  const [qtyMode, setQtyMode] = useStorage<QtyMode>(
    {
      key: "last_send_qty_mode",
      instance: ExtensionStorage
    },
    "token"
  );

  // tokens
  const tokens = useTokens();

  // token that the user is going to send
  const [tokenID, setTokenID] = useStorage<"AR" | string>(
    {
      key: "last_send_token",
      instance: ExtensionStorage
    },
    "AR"
  );

  const token = useMemo<TokenInterface>(
    () => tokens.find((t) => t.id === tokenID) || arPlaceholder,
    [tokenID]
  );

  // if the ID is defined on mount, that means that
  // we need to reset the qty field
  useEffect(() => {
    if (!id) return;
    setTokenID(id);
    setQty("");
  }, []);

  // token logo
  const [logo, setLogo] = useState<string>();
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      setLogo(viewblock.getTokenLogo(token.id));
      setLogo(await loadTokenLogo(token.id, token.defaultLogo, theme));
    })();
  }, [theme, token]);

  //arweave logo
  const arweaveLogo = useMemo(
    () => (theme === "light" ? arLogoLight : arLogoDark),
    [theme]
  );

  // balance
  const [balance, setBalance] = useState(0);
  const arBalance = useBalance();

  // Handle Recipient Slider
  const [showSlider, setShowSlider] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (token.id === "AR") {
        return setBalance(arBalance);
      }

      // placeholder balance
      setBalance(token.balance);

      const dre = await getDreForToken(token.id);
      const contract = new DREContract(id, new DRENode(dre));
      const result = await contract.query<[number]>(
        `$.balances.${activeAddress}`
      );

      setBalance(
        balanceToFractioned(result[0], {
          id: token.id,
          decimals: token.decimals,
          divisibility: token.divisibility
        })
      );
    })();
  }, [token, activeAddress, arBalance]);

  // token price
  const [price, setPrice] = useState(0);
  const message = useInput();

  useEffect(() => {
    (async () => {
      if (token.id === "AR") {
        const arPrice = await getPrice("arweave", currency);

        return setPrice(arPrice);
      }

      // get price from redstone
      const res = await redstone.getPrice(token.ticker);

      if (!res.value) {
        return setPrice(0);
      }

      // get price in currency
      const multiplier =
        currency !== "usd" ? await getPrice("usd", currency) : 1;

      setPrice(res.value * multiplier);
    })();
  }, [token, currency]);

  // quantity in the other currency
  const secondaryQty = useMemo(() => {
    const qtyParsed = parseFloat(qty) || 0;

    if (qtyMode === "token") return qtyParsed * price;
    else return qtyParsed * (1 / price);
  }, [qty, qtyMode, price]);

  // network fee
  const [networkFee, setNetworkFee] = useState<string>("0");

  useEffect(() => {
    (async () => {
      if (token.id !== "AR") {
        return setNetworkFee("0");
      }

      let byte = 0;
      if (message.state) {
        byte = new TextEncoder().encode(message.state).length;
      }
      const gateway = await findGateway({});
      const arweave = new Arweave(gateway);
      const txPrice = await arweave.transactions.getPrice(byte, "dummyTarget");

      setNetworkFee(arweave.ar.winstonToAr(txPrice));
    })();
  }, [token, message.state]);

  // maximum possible send amount
  const max = useMemo(() => {
    let maxAmountToken = balance - parseFloat(networkFee);

    if (token.id !== "AR") maxAmountToken = balance;

    return maxAmountToken * (qtyMode === "fiat" ? price : 1);
  }, [balance, token, networkFee, qtyMode]);

  // switch back to token qty mode if the
  // token does not have a fiat price
  useEffect(() => {
    if (!!price) return;
    setQtyMode("token");
  }, [price]);

  // switch between fiat qty mode / token qty mode
  function switchQtyMode() {
    if (!price) return;
    setQty(secondaryQty.toFixed(4));
    setQtyMode((val) => (val === "fiat" ? "token" : "fiat"));
  }

  // invalid qty
  const invalidQty = useMemo(() => {
    const parsedQty = Number(qty);

    if (Number.isNaN(parsedQty)) return true;

    return parsedQty < 0 || parsedQty > max;
  }, [qty, max]);

  // show token selector
  const [showTokenSelector, setShownTokenSelector] = useState(false);

  function updateSelectedToken(id: string) {
    setTokenID(id);
    setQty("");
    setShownTokenSelector(false);
  }

  const uToken = isUToken(tokenID);

  // qty text size
  const qtySize = useMemo(() => {
    const maxLengthDef = 7;
    const symbol =
      qtyMode === "token" ? token.ticker : getCurrencySymbol(currency);
    const qtyLength = qty === "" ? 4 : qty.length;
    const qtyLengthWithSymbol = qtyLength + symbol.length;

    if (qtyLengthWithSymbol <= maxLengthDef) return defaulQtytSize;
    return defaulQtytSize / (qtyLengthWithSymbol / maxLengthDef);
  }, [qty, qtyMode, currency, token]);

  // router push
  const [push] = useHistory();

  // prepare tx to send
  async function send() {
    // check qty
    if (invalidQty || qty === "" || Number(qty) === 0) return;

    const finalQty = fractionedToBalance(Number(qty), {
      id: token.id,
      decimals: token.decimals,
      divisibility: token.divisibility
    });

    // continue to recipient selection
    push(
      `/send/recipient/${tokenID}/${finalQty}${
        message.state ? `/${message.state}` : ""
      }`
    );
  }

  return (
    <Wrapper>
      <SendForm>
        <HeadV2 title={browser.i18n.getMessage("send")} />
        {/* TOP INPUT */}
        <div style={{ gap: "7px", display: "flex", flexDirection: "column" }}>
          {/* TODO: onclick make this hover similar to focus on input */}
          <SendButton fullWidth alternate>
            <span>{browser.i18n.getMessage("select_recipient")}</span>
            <ChevronDownIcon />
          </SendButton>
          <SendInput
            type="number"
            placeholder={"Amount"}
            value={qty}
            error={invalidQty}
            status={invalidQty ? "error" : "default"}
            onChange={(e) => setQty((e.target as HTMLInputElement).value)}
            fullWidth
            icon={
              <InputIcons>
                <CurrencyButton small onClick={switchQtyMode}>
                  <Currency active={qtyMode === "fiat"}>USD</Currency>/
                  <Currency active={qtyMode === "token"}>
                    {token.ticker.toUpperCase()}
                  </Currency>
                </CurrencyButton>
                <MaxButton
                  altColor={theme === "dark" && "#423D59"}
                  small
                  onClick={() => setQty(max.toString())}
                >
                  Max
                </MaxButton>
              </InputIcons>
            }
          />
        </div>
        <Datas>
          {!!price && (
            <Text noMargin>
              ≈
              {qtyMode === "fiat"
                ? formatTokenBalance(secondaryQty)
                : formatFiatBalance(secondaryQty, currency)}
              {qtyMode === "fiat" && " " + token.ticker}
            </Text>
          )}
          <Text noMargin>
            ~{networkFee}
            {" AR "}
            {browser.i18n.getMessage("network_fee")}
          </Text>
        </Datas>
        {!uToken && (
          <SendInput
            {...message.bindings}
            type="text"
            placeholder={browser.i18n.getMessage("send_message_optional")}
            fullWidth
          />
        )}
      </SendForm>
      <Spacer y={1} />
      <BottomActions>
        <TokenSelector onClick={() => setShownTokenSelector(true)}>
          <LogoAndDetails>
            <LogoWrapper small>
              <Logo src={logo || arweaveLogo} />
            </LogoWrapper>
            <TokenName>{token.name || token.ticker}</TokenName>
          </LogoAndDetails>
          <TokenSelectorRightSide>
            <Text noMargin>{browser.i18n.getMessage("setting_currency")}</Text>
            <ChevronRightIcon />
          </TokenSelectorRightSide>
        </TokenSelector>

        <SendButton
          disabled={invalidQty || parseFloat(qty) === 0 || qty === ""}
          fullWidth
          onClick={send}
        >
          {browser.i18n.getMessage("next")}
          <ArrowUpRightIcon />
        </SendButton>
      </BottomActions>
      <AnimatePresence>
        {showTokenSelector && (
          <TokenSelectorWrapper
            variants={animation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <TokensSection>
              <ArToken onClick={() => updateSelectedToken("AR")} />
              {tokens
                .filter((token) => token.type === "asset")
                .map((token, i) => (
                  <Token
                    {...token}
                    onClick={() => updateSelectedToken(token.id)}
                    key={i}
                  />
                ))}
            </TokensSection>
            <CollectiblesList>
              {tokens
                .filter((token) => token.type === "collectible")
                .map((token, i) => (
                  <Collectible
                    id={token.id}
                    name={token.name || token.ticker}
                    balance={token.balance}
                    divisibility={token.divisibility}
                    decimals={token.decimals}
                    onClick={() => updateSelectedToken(token.id)}
                    key={i}
                  />
                ))}
            </CollectiblesList>
          </TokenSelectorWrapper>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Currency = styled.span<{ active: boolean }>`
  color: ${(props) => (!props.active ? "#B9B9B9" : "#ffffff")};
`;

const MaxButton = styled(Button)<{ altColor?: string }>`
  border-radius: 3px;
  padding: 5px;
  color: ${(props) => (props.altColor ? "#b9b9b9" : props.theme.theme)};
  background-color: ${(props) =>
    props.altColor ? props.altColor : props.theme.theme};
  font-weight: 400;
`;

const CurrencyButton = styled(Button)`
  font-weight: 400;
  background-color: transparent;
  border-radius: 4px;
  gap: 0;
  display: flex;
  padding: 2px;
`;

const Wrapper = styled.div`
  height: calc(100vh - 15px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SendForm = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 15px;
  gap: 15px;
  justify-content: space-between;
`;

interface Props {
  id?: string;
}

type QtyMode = "fiat" | "token";

const QuantitySection = styled.div<{ qtyMode: QtyMode; invalidValue: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${(props) => (props.qtyMode === "token" ? "0.65rem" : "0")};
  height: ${defaulQtytSize + "rem"};

  input,
  p {
    color: rgb(
      ${(props) => (props.invalidValue ? "255, 0, 0" : props.theme.theme)}
    );
    transition: color 0.23s ease-in-out;
  }
`;

// Make this dynamic
const SendButton = styled(Button)<{ alternate?: boolean }>`
  background-color: ${(props) => props.alternate && "rgb(171, 154, 255, 0.15)"};
  border: 1px solid rgba(171, 154, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.alternate ? "space-between" : "center")};
  width: 100%;
  color: ${(props) => props.alternate && "#b9b9b9"};
  padding: 10px;
  font-weight: 400;
`;

export const SendInput = styled(Input)<{ error?: boolean }>`
  color: ${(props) => (props.error ? "red" : "#b9b9b9")};
  background-color: rgba(171, 154, 255, 0.15);
  padding: 10px;
`;

const InputIcons = styled.div`
  display: flex;
  gap: 0.625rem;
`;

const qtyTextStyle = css`
  font-size: ${defaulQtytSize}rem;
  font-weight: 500;
  line-height: 1.1em;
`;

const BottomActions = styled(Section)`
  display: flex;
  padding: 0 15px;
  gap: 1rem;
  flex-direction: column;
`;

const Datas = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-direction: column;
  justify-content: center;

  p {
    font-size: 0.83rem;
  }
`;

const TokenSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  transition: all 0.12s ease-;

  &:active {
    transform: scale(0.97);
  }

  p {
    color: rgb(${(props) => props.theme.theme});
  }
`;

const TokenSelectorRightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 0.36rem;

  svg {
    font-size: 1.5rem;
    width: 1em;
    height: 1em;
    color: rgb(${(props) => props.theme.theme});
  }

  p {
    text-transform: uppercase;
    font-size: 0.7rem;
  }
`;

const TokenSelectorWrapper = styled(motion.div)<{ partial?: boolean }>`
  position: fixed;
  top: ${(props) => (props.partial ? "50px" : 0)};
  left: 0;
  bottom: 0;
  right: 0;
  overflow-y: auto;
  background-color: rgb(${(props) => props.theme.background});
  z-index: 1000;
`;

const animation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const TokensSection = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
  padding-top: 2rem;
  padding-bottom: 1.4rem;
`;

const CollectiblesList = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  padding-top: 0;
`;
