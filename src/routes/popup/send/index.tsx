import { PageType, trackPage } from "~utils/analytics";
import { useState, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";
import {
  ButtonV2,
  InputV2,
  Section,
  Spacer,
  Text,
  useInput
} from "@arconnect/components";
import browser from "webextension-polyfill";
import * as viewblock from "~lib/viewblock";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from "@iconicicons/react";
import Token, {
  ArToken,
  Logo,
  LogoAndDetails,
  LogoWrapper,
  TokenName,
  WarningIcon
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
import { useActiveWallet, useBalance } from "~wallets/hooks";
import { getArPrice, getPrice } from "~lib/coingecko";
import redstone from "redstone-api";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Collectible from "~components/popup/Collectible";
import { findGateway } from "~gateways/wayfinder";
import { useHistory } from "~utils/hash_router";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import { isUToken } from "~utils/send";
import HeadV2 from "~components/popup/HeadV2";
import SliderMenu from "~components/SliderMenu";
import Recipient, {
  AutoContactPic,
  generateProfileIcon,
  type Contact,
  ProfilePicture
} from "~components/Recipient";
import { formatAddress } from "~utils/format";
import { useContact } from "~contacts/hooks";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { useAoTokens } from "~tokens/aoTokens/ao";
import BigNumber from "bignumber.js";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";
import { AnnouncementPopup } from "./announcement";

// default size for the qty text
const defaulQtytSize = 3.7;
export const arPlaceholder: TokenInterface = {
  id: "AR",
  name: "Arweave",
  ticker: "AR",
  type: "asset",
  balance: "0",
  decimals: 12
};

export type RecipientType = {
  contact?: Contact;
  address: string;
};

export interface TransactionData {
  networkFee: string;
  estimatedFiat: string;
  qty: string;
  token: TokenInterface;
  estimatedNetworkFee: string;
  recipient: RecipientType;
  qtyMode: string;
  message?: string;
  isAo?: boolean;
}

export default function Send({ id }: Props) {
  // Segment
  useEffect(() => {
    trackPage(PageType.SEND);
  }, []);

  const [isOpen, setOpen] = useState(true);

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

  // aoTokens
  const [aoTokens, loading] = useAoTokens(true);

  // set ao for following page
  const [isAo, setIsAo] = useState<boolean>(false);

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

  const token = useMemo<TokenInterface>(() => {
    const matchingTokenInTokens = tokens.find((t) => t.id === tokenID);

    const matchingTokenInAoTokens = !matchingTokenInTokens
      ? aoTokens.find((aoToken) => aoToken.id === tokenID)
      : null;
    if (matchingTokenInAoTokens) {
      setIsAo(true);
      return {
        decimals: matchingTokenInAoTokens.Denomination,
        id: matchingTokenInAoTokens.id,
        ticker: matchingTokenInAoTokens.Ticker,
        type: "asset",
        balance: matchingTokenInAoTokens.balance,
        defaultLogo: matchingTokenInAoTokens.Logo
      };
    }

    setIsAo(false);
    return matchingTokenInTokens || arPlaceholder;
  }, [tokenID, tokens, aoTokens]);

  const degraded = useMemo(() => {
    if (loading) {
      return false;
    }
    return token.balance === null;
  }, [token, loading]);

  // if the ID is defined on mount, that means that
  // we need to reset the qty field
  useEffect(() => {
    if (!id) return;
    setTokenID(id);
    setQty("");
  }, []);

  useEffect(() => {
    (async () => {
      const existingTxn: TransactionData = await TempTransactionStorage.get(
        "send"
      );
      if (existingTxn.recipient) {
        setRecipient(existingTxn.recipient);
        setQtyMode(existingTxn.qtyMode as QtyMode);
      }
    })();
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
  const [balance, setBalance] = useState("0");
  const arBalance = useBalance();

  // Handle Recipient Input and Slider
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<RecipientType>({ address: "" });
  const contact = useContact(recipient.address);

  useEffect(() => {
    (async () => {
      if (token.id === "AR") {
        return setBalance(arBalance.toString());
      }

      // placeholder balance
      setBalance(token.balance);
      if (!isAo) {
        const dre = await getDreForToken(token.id);
        const contract = new DREContract(tokenID || id, new DRENode(dre));
        const result = await contract.query<[number]>(
          `$.balances.${activeAddress}`
        );

        setBalance(
          balanceToFractioned(String(result[0] || 0), {
            id: token.id,
            decimals: token.decimals,
            divisibility: token.divisibility
          }).toString()
        );
      } else {
        setBalance(token.balance);
      }
    })();
  }, [token, activeAddress, arBalance.toString(), id]);

  // token price
  const [price, setPrice] = useState("0");
  const message = useInput();

  useEffect(() => {
    (async () => {
      if (token.id === "AR") {
        const arPrice = await getArPrice(currency);

        return setPrice(arPrice.toString());
      }

      // get price from redstone

      if (isAo) {
        return setPrice("0");
      }

      const redstonePromise = redstone.getPrice(token.ticker);
      const multiplierPromise =
        currency === "usd"
          ? 1
          : await getPrice("usd", currency).catch((err) => {
              console.warn(`Error fetching price for ${currency}`, err);

              return 0;
            });

      const [redstoneResponse, multiplier] = await Promise.all([
        redstonePromise,
        multiplierPromise
      ]);

      const redstoneValue = redstoneResponse.value;

      setPrice(
        redstoneResponse && multiplier
          ? BigNumber(redstoneValue).multipliedBy(multiplier).toString()
          : "0"
      );
    })();
  }, [token, currency]);

  // quantity in the other currency
  const secondaryQty = useMemo(() => {
    const qtyParsed = BigNumber(qty || "0");

    if (qtyMode === "token") return qtyParsed.multipliedBy(price);
    else return qtyParsed.dividedBy(price);
  }, [qty, qtyMode, price]);

  // network fee
  const [networkFee, setNetworkFee] = useState<string>("0");
  const [, goBack] = useHistory();

  useEffect(() => {
    (async () => {
      if (token.id !== "AR") {
        return setNetworkFee("0");
      }

      let byte = 0;
      if (message.state) {
        byte = new TextEncoder().encode(message.state).byteLength;
      }
      const gateway = await findGateway({});
      const arweave = new Arweave(gateway);
      const txPrice = await arweave.transactions.getPrice(
        byte,
        recipient.address
      );

      setNetworkFee(arweave.ar.winstonToAr(txPrice));
    })();
  }, [token, message.state, recipient.address]);

  // maximum possible send amount
  const max = useMemo(() => {
    const balanceBigNum = BigNumber(balance);
    const networkFeeBigNum = BigNumber(networkFee);
    const maxAmountToken =
      token.id === "AR"
        ? BigNumber.max(0, balanceBigNum.minus(networkFeeBigNum))
        : balanceBigNum;

    return maxAmountToken.multipliedBy(qtyMode === "fiat" ? price : 1);
  }, [balance, token, networkFee, qtyMode]);

  // switch back to token qty mode if the
  // token does not have a fiat price
  useEffect(() => {
    if (!!+price) return;
    setQtyMode("token");
  }, [price]);

  // switch between fiat qty mode / token qty mode
  function switchQtyMode() {
    if (!+price) return;

    let formattedQuantity = secondaryQty.toFixed(4);

    if (formattedQuantity === "0.0000") formattedQuantity = "0";

    setQty(formattedQuantity);
    setQtyMode((val) => (val === "fiat" ? "token" : "fiat"));
  }

  // invalid qty
  const invalidQty = useMemo(() => {
    const parsedQty = BigNumber(qty);

    if (parsedQty.isNaN()) return true;

    return parsedQty.lt(0) || max.lt(parsedQty);
  }, [qty, max.toString()]);

  // show token selector
  const [showTokenSelector, setShownTokenSelector] = useState(false);

  function updateSelectedToken(id: string) {
    if (id === AO_NATIVE_TOKEN) {
      setOpen(true);
    }
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

    const finalQty = fractionedToBalance(
      qty,
      {
        id: token.id,
        decimals: token.decimals,
        divisibility: token.divisibility
      },
      token.id === "AR" ? "AR" : isAo ? "AO" : "WARP"
    );

    await TempTransactionStorage.set("send", {
      networkFee,
      qty: qtyMode === "fiat" ? secondaryQty.toFixed() : qty,
      token,
      recipient,
      estimatedFiat: qtyMode === "fiat" ? qty : secondaryQty.toFixed(),
      estimatedNetworkFee: BigNumber(networkFee).multipliedBy(price).toFixed(),
      message: message.state,
      qtyMode,
      isAo
    });

    // continue to confirmation page
    push(`/send/confirm/${tokenID}/${finalQty}/${recipient.address}`);
  }

  return (
    <>
      <HeadV2
        back={() => {
          TempTransactionStorage.removeItem("send");
          setQty("");
          goBack();
        }}
        title={browser.i18n.getMessage("send")}
      />
      {AO_NATIVE_TOKEN === tokenID && (
        <AnnouncementPopup isOpen={isOpen} setOpen={setOpen} />
      )}
      <Wrapper showOverlay={showSlider || degraded}>
        <SendForm>
          {/* TOP INPUT */}
          {degraded && (
            <Degraded>
              <WarningWrapper>
                <WarningIcon color={theme === "dark" ? "#fff" : "#000"} />
              </WarningWrapper>
              <div>
                <h4>{browser.i18n.getMessage("ao_degraded")}</h4>
                <span>
                  {browser.i18n
                    .getMessage("ao_degraded_description")
                    .replace("<br/>", "")}
                </span>
              </div>
            </Degraded>
          )}

          <RecipientAmountWrapper>
            <SendButton
              fullWidth
              secondary
              alternate
              onClick={() => {
                setShowSlider(!showSlider);
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                {contact && contact.profileIcon ? (
                  <ProfilePicture size="24px" src={contact.profileIcon} />
                ) : (
                  contact && (
                    <AutoContactPic size="24px">
                      {generateProfileIcon(contact.name || contact.address)}
                    </AutoContactPic>
                  )
                )}
                {!recipient.address
                  ? browser.i18n.getMessage("select_recipient")
                  : contact && contact.name
                  ? contact.name
                  : formatAddress(recipient.address, 10)}
              </span>
              <ChevronDownIcon />
            </SendButton>
            <SendInput
              type="number"
              placeholder={"Amount"}
              value={qty}
              error={invalidQty}
              status={invalidQty ? "error" : "default"}
              onChange={(e) => setQty((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (
                  e.key !== "Enter" ||
                  invalidQty ||
                  parseFloat(qty) === 0 ||
                  qty === "" ||
                  recipient.address === ""
                )
                  return;
                send();
              }}
              fullWidth
              icon={
                <InputIcons>
                  <CurrencyButton
                    onClick={switchQtyMode}
                    disabled={isAo || !+price}
                  >
                    {!!+price && (
                      <>
                        <Currency active={qtyMode === "fiat"}>USD</Currency>
                        {"/"}
                      </>
                    )}
                    <Currency active={qtyMode === "token"}>
                      {token.ticker.toUpperCase()}
                    </Currency>
                  </CurrencyButton>
                  <MaxButton
                    disabled={degraded}
                    altColor={theme === "dark" && "#423D59"}
                    onClick={() => setQty(max.toFixed())}
                  >
                    Max
                  </MaxButton>
                </InputIcons>
              }
            />
          </RecipientAmountWrapper>
          <Datas>
            {!!+price && !isAo ? (
              <Text noMargin>
                ≈
                {qtyMode === "fiat"
                  ? formatTokenBalance(secondaryQty)
                  : formatFiatBalance(secondaryQty, currency)}
                {qtyMode === "fiat" && " " + token.ticker}
              </Text>
            ) : (
              <></>
            )}
            <Text noMargin>
              ~{networkFee}
              {" AR "}
              {browser.i18n.getMessage("network_fee")}
            </Text>
          </Datas>
          {!uToken && (
            <MessageWrapper>
              <SendInput
                {...message.bindings}
                type="text"
                placeholder={browser.i18n.getMessage("send_message_optional")}
                fullWidth
              />
            </MessageWrapper>
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
              {isAo && <Image src={aoLogo} alt="ao logo" />}
            </LogoAndDetails>
            <TokenSelectorRightSide>
              <Text noMargin>
                {browser.i18n.getMessage("setting_currency")}
              </Text>
              <ChevronRightIcon />
            </TokenSelectorRightSide>
          </TokenSelector>

          <ButtonV2
            disabled={
              invalidQty ||
              parseFloat(qty) === 0 ||
              qty === "" ||
              recipient.address === "" ||
              AO_NATIVE_TOKEN === tokenID
            }
            fullWidth
            onClick={send}
          >
            {browser.i18n.getMessage("next")}
            <ArrowUpRightIcon style={{ marginLeft: "5px" }} />
          </ButtonV2>
        </BottomActions>

        <SliderMenu
          title={browser.i18n.getMessage("currency")}
          isOpen={showTokenSelector}
          onClose={() => {
            setShownTokenSelector(false);
          }}
        >
          <TokensList>
            <ArToken onClick={() => updateSelectedToken("AR")} />

            {aoTokens.map((token, i) => (
              <Token
                key={token.id}
                ao={true}
                type={"asset"}
                defaultLogo={token?.Logo}
                id={token.id}
                ticker={token.Ticker}
                divisibility={token.Denomination}
                balance={token.balance || "0"}
                onClick={() => updateSelectedToken(token.id)}
              />
            ))}

            {tokens
              .filter((token) => token.type === "asset")
              .map((token, i) => (
                <Token
                  {...token}
                  onClick={() => updateSelectedToken(token.id)}
                  key={i}
                />
              ))}
          </TokensList>

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
        </SliderMenu>

        <SliderMenu
          title={browser.i18n.getMessage("send_to")}
          isOpen={showSlider}
          onClose={() => {
            setShowSlider(false);
          }}
        >
          <Recipient
            onClick={setRecipient}
            onClose={() => setShowSlider(false)}
          />
        </SliderMenu>
      </Wrapper>
    </>
  );
}

const Currency = styled.span<{ active: boolean }>`
  color: ${(props) => (!props.active ? "#B9B9B9" : props.theme.primaryTextv2)};
`;

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const MessageWrapper = styled.div`
  padding: 0 15px;
`;

const RecipientAmountWrapper = styled.div`
  display: flex;
  padding: 0 15px;
  flex-direction: column;
  gap: 7px;
`;

const MaxButton = styled.button<{ altColor?: string }>`
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;
  outline: none;
  font-size: 13.28px;
  gap: 0.3rem;
  border-radius: 3px;
  padding: 5px;
  border: 0px;
  cursor: pointer;
  color: ${(props) => (props.altColor ? "#b9b9b9" : props.theme.theme)};
  background-color: ${(props) =>
    props.altColor ? props.altColor : props.theme.theme};
  font-weight: 400;
  box-shadow: 0 0 0 0 rgba(${(props) => props.theme.theme});
`;

const CurrencyButton = styled.button<{ altColor?: string }>`
  font-weight: 400;
  background-color: transparent;
  border-radius: 4px;
  gap: 0;
  display: flex;
  padding: 2px;
  font-size: 13.28px;
  cursor: pointer;
  text-align: center;
  align-items: center;
  justify-content: center;
  outline: none;
  border: 0px;
  color: #b9b9b9;
`;

const Wrapper = styled.div<{ showOverlay: boolean }>`
  height: calc(100vh - 144px);
  padding-top: 2px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;

  &::before {
    content: "";
    position: absolute; // Position the overlay
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(${(props) => props.theme.background}, 0.5);
    z-index: 10;
    display: ${({ showOverlay }) => (showOverlay ? "block" : "none")};
  }
`;

const SendForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  justify-content: space-between;
`;

interface Props {
  id?: string;
}

type QtyMode = "fiat" | "token";

// Make this dynamic
export const SendButton = styled(ButtonV2)<{ alternate?: boolean }>`
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

  &:hover:not(:active):not(:disabled) {
    box-shadow: 0 0 0 0.075rem rgba(${(props) => props.theme.theme}, 0.5);
    background-color: none;
  }
`;

export const Degraded = styled.div`
  background: ${(props) => props.theme.backgroundSecondary};
  display: flex;
  margin: 0 0.9375rem;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.fail};
  position: relative;
  z-index: 11;
  border-radius: 0.625rem;

  h4 {
    font-weight: 500;
    font-size: 14px;
    margin: 0;
    padding: 0;
    font-size: inherit;
  }

  span {
    color: ${(props) => props.theme.secondaryTextv2};
    font-size: 12px;
  }
`;

export const WarningWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const SendInput = styled(InputV2)<{ error?: boolean }>`
  color: ${(props) => (props.error ? "red" : "#b9b9b9")};
  background-color: rgba(171, 154, 255, 0.15);
  font-weight: 400;
  font-size: 1rem;
  padding: 10px;

  // remove counter
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const InputIcons = styled.div`
  display: flex;
  gap: 0.625rem;
`;

const BottomActions = styled(Section)`
  display: flex;
  padding: 0 15px;
  gap: 1rem;
  flex-direction: column;
`;

const Datas = styled.div`
  display: flex;
  padding: 0 15px;
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
  z-index: 20;

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

const TokensList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
  padding: 0;
  margin: 0;
`;

const CollectiblesList = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  padding-top: 0;

  &:empty {
    display: none;
  }
`;
