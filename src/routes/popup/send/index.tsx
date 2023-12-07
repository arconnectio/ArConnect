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
      <div>
        <Head title={browser.i18n.getMessage("send")} />
        <Spacer y={1} />
        <QuantitySection qtyMode={qtyMode} invalidValue={invalidQty}>
          <Switch disabled={!price} onClick={switchQtyMode} />
          {qtyMode === "fiat" && (
            <Ticker style={{ fontSize: `${qtySize}rem` }}>
              {getCurrencySymbol(currency)}
            </Ticker>
          )}
          <Quantity>
            <QuantityInput
              value={qty}
              onKeyDown={(e) => {
                if (
                  [
                    "Backspace",
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "."
                  ].includes(e.key)
                )
                  return;
                e.preventDefault();
              }}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0.00"
              style={{ fontSize: `${qtySize}rem` }}
              qtyMode={qtyMode}
              autoFocus
            />
            <Imitate style={{ fontSize: `${qtySize}rem` }}>
              {qty !== "" ? qty : "0.00"}
            </Imitate>
          </Quantity>
          {qtyMode === "token" && (
            <Ticker style={{ fontSize: `${qtySize}rem` }}>
              {token.ticker.toUpperCase()}
            </Ticker>
          )}
          <Max onClick={() => setQty(max.toString())}>Max</Max>
        </QuantitySection>
        <Spacer y={1} />
        <Message>
          <Input
            {...message.bindings}
            type="text"
            placeholder={browser.i18n.getMessage("send_message_optional")}
            fullWidth
          />
        </Message>
        <Spacer y={1} />
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
      </div>
      <BottomActions>
        <TokenSelector onClick={() => setShownTokenSelector(true)}>
          <LogoAndDetails>
            <LogoWrapper>
              <Logo src={logo || arweaveLogo} />
            </LogoWrapper>
            <TokenName>{token.name || token.ticker}</TokenName>
          </LogoAndDetails>
          <TokenSelectorRightSide>
            <Text noMargin>{browser.i18n.getMessage("setting_currency")}</Text>
            <ChevronRightIcon />
          </TokenSelectorRightSide>
        </TokenSelector>

        <Button
          disabled={invalidQty || parseFloat(qty) === 0 || qty === ""}
          fullWidth
          onClick={send}
        >
          {browser.i18n.getMessage("send")}
          <ArrowUpRightIcon />
        </Button>
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

const Message = styled.div`
  padding: 0 1.25rem;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  gap: 2.5rem;
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

const Quantity = styled.div`
  position: relative;
  width: max-content;
  z-index: 1;
  height: max-content;
`;

const qtyTextStyle = css`
  font-size: ${defaulQtytSize}rem;
  font-weight: 500;
  line-height: 1.1em;
`;

const QuantityInput = styled.input.attrs({
  type: "text"
})<{ qtyMode: QtyMode }>`
  position: absolute;
  width: 100%;
  outline: none;
  border: none;
  background-color: transparent;
  padding: 0;
  z-index: 10;
  text-align: ${(props) => (props.qtyMode === "token" ? "right" : "left")};
  ${qtyTextStyle}
`;

const Imitate = styled.p`
  color: transparent;
  z-index: 1;
  margin: 0;
  text-align: right;
  ${qtyTextStyle}
`;

const Ticker = styled.p`
  margin: 0;
  text-transform: uppercase;
  ${qtyTextStyle}
`;

const BottomActions = styled(Section)`
  display: flex;
  gap: 1rem;
  flex-direction: column;
`;

const Datas = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-direction: column;
  justify-content: center;
  padding: 0 1.25rem;

  p {
    font-size: 0.83rem;
  }
`;

const floatingAction = css`
  position: absolute;
  top: 50%;
  cursor: pointer;
  transform: translateY(-50%);
  transition: all 0.17s ease;

  &:hover {
    opacity: 0.83;
  }

  &:active {
    transform: translateY(-50%) scale(0.94);
  }
`;

const Max = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.primaryText});
  font-size: 0.95rem;
  right: 20px;
  text-transform: uppercase;
  text-align: center;
  ${floatingAction}
`;

const Switch = styled(RefreshIcon)<{ disabled: boolean }>`
  font-size: 1.45rem;
  width: 1em;
  height: 1em;
  left: 20px;
  opacity: ${(props) => (props.disabled ? ".7" : "1")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")} !important;
  ${floatingAction}
`;

const TokenSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1.1rem;
  border-radius: 25px;
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

const TokenSelectorWrapper = styled(motion.div)`
  position: fixed;
  top: 0;
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

const expandAnimation: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  shown: {
    opacity: 1,
    height: "auto"
  }
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
