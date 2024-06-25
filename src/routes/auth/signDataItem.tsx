import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  ButtonV2,
  InputV2,
  Loading,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import {
  FiatAmount,
  AmountTitle,
  Properties,
  TransactionProperty,
  PropertyName,
  PropertyValue,
  TagValue,
  useAdjustAmountTitleWidth
} from "~routes/popup/transaction/[id]";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { formatAddress } from "~utils/format";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { checkPassword } from "~wallets/auth";
import { Quantity, Token } from "ao-tokens";
import prettyBytes from "pretty-bytes";
import { formatFiatBalance } from "~tokens/currency";
import useSetting from "~settings/hook";
import { getPrice } from "~lib/coingecko";
import type { TokenInfo, TokenInfoWithProcessId } from "~tokens/aoTokens/ao";
import { ChevronUpIcon, ChevronDownIcon } from "@iconicicons/react";
import { getUserAvatar } from "~lib/avatar";
import { LogoWrapper, Logo } from "~components/popup/Token";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { useTheme } from "~utils/theme";

interface Tag {
  name: string;
  value: string;
}

interface DataStructure {
  data: number[];
  target?: string;
  tags: Tag[];
}

export default function SignDataItem() {
  // connect params
  const params = useAuthParams<{
    appData: { appURL: string };
    data: DataStructure;
  }>();

  const [password, setPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenName, setTokenName] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [amount, setAmount] = useState<Quantity | null>(null);
  const [showTags, setShowTags] = useState<boolean>(false);
  const { setToast } = useToasts();

  const recipient =
    params?.data?.tags?.find((tag) => tag.name === "Recipient")?.value || "";
  const quantity =
    params?.data?.tags?.find((tag) => tag.name === "Quantity")?.value || "0";
  const transfer = params?.data?.tags?.some(
    (tag) => tag.name === "Action" && tag.value === "Transfer"
  );

  const process = params?.data?.target;

  const formattedAmount = useMemo(
    () => (amount || 0).toLocaleString(),
    [amount]
  );

  // adjust amount title font sizes
  const parentRef = useRef(null);
  const childRef = useRef(null);
  useAdjustAmountTitleWidth(parentRef, childRef, formattedAmount);

  const [signatureAllowance] = useStorage(
    {
      key: "signatureAllowance",
      instance: ExtensionStorage
    },
    10
  );

  // active address
  const [activeAddress] = useStorage<string>(
    {
      key: "active_address",
      instance: ExtensionStorage
    },
    ""
  );

  const theme = useTheme();

  const arweaveLogo = useMemo(
    () => (theme === "dark" ? arLogoDark : arLogoLight),
    [theme]
  );

  // currency setting
  const [currency] = useSetting<string>("currency");

  // token price
  const [price, setPrice] = useState(0);

  // transaction price
  const fiatPrice = useMemo(() => +(amount || 0) * price, [amount]);

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signDataItem", params?.authID);

  const passwordInput = useInput();

  // sign message
  async function sign() {
    if (password) {
      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400
        });
        return;
      }
    }

    // send response
    await replyToAuthRequest("signDataItem", params?.authID);

    // close the window
    closeWindow();
  }

  useEffect(() => {
    if (amount === null) return;

    if (signatureAllowance < amount?.toNumber()) {
      setPassword(true);
    } else {
      setPassword(false);
    }
  }, [signatureAllowance, amount]);

  useEffect(() => {
    if (!tokenName) return;
    getPrice(tokenName, currency)
      .then((res) => setPrice(res))
      .catch();
  }, [currency, tokenName]);

  // get ao token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!process) return;
      let tokenInfo: TokenInfo;
      try {
        setLoading(true);
        const token = await Token(params.data.target);
        tokenInfo = {
          ...token.info,
          Denomination: Number(token.info.Denomination)
        };
      } catch (err) {
        // fallback
        console.log("err", err);
        try {
          const aoTokens =
            (await ExtensionStorage.get<TokenInfoWithProcessId[]>(
              "ao_tokens"
            )) || [];
          const aoTokensCache =
            (await ExtensionStorage.get<TokenInfoWithProcessId[]>(
              "ao_tokens_cache"
            )) || [];
          const aoTokensCombined = [...aoTokens, ...aoTokensCache];
          const token = aoTokensCombined.find(
            ({ processId }) => params.data.target === processId
          );
          if (token) {
            tokenInfo = token;
          }
        } catch {}
      } finally {
        if (tokenInfo) {
          if (tokenInfo?.Logo) {
            const logo = await getUserAvatar(tokenInfo?.Logo);
            setLogo(logo || "");
          } else {
            setLogo(arweaveLogo);
          }

          const tokenAmount = new Quantity(
            BigInt(quantity),
            BigInt(tokenInfo.Denomination)
          );
          setTokenName(tokenInfo.Name);
          setAmount(tokenAmount);
        }
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [params]);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (password) return;
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [params?.authID, password]);

  useEffect(() => {
    if (tokenName && !logo) {
      setLogo(arweaveLogo);
    }
  }, [tokenName, logo, theme]);

  return (
    <Wrapper ref={parentRef}>
      <div>
        <HeadV2
          title={browser.i18n.getMessage("sign_item")}
          showOptions={false}
          back={cancel}
        />
        <Description>
          <Text noMargin>
            {browser.i18n.getMessage(
              "sign_data_description",
              params?.appData.appURL
            )}
          </Text>
        </Description>
        {params ? (
          <Section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "4px"
              }}
            >
              {!loading ? (
                logo && (
                  <LogoWrapper>
                    <Logo src={logo} alt={`${tokenName} logo`} />
                  </LogoWrapper>
                )
              ) : (
                <Loading style={{ width: "16px", height: "16px" }} />
              )}
            </div>
            {transfer && (
              <>
                <FiatAmount>
                  {formatFiatBalance(fiatPrice, currency)}
                </FiatAmount>
                <AmountTitle
                  ref={childRef}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    marginBottom: "16px"
                  }}
                >
                  {formattedAmount}
                  <span style={{ lineHeight: "1.5em" }}>{tokenName}</span>
                </AmountTitle>
              </>
            )}

            <Properties>
              {params?.data?.target && (
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("process_id")}
                  </PropertyName>
                  <PropertyValue>
                    {formatAddress(params?.data.target, 6)}
                  </PropertyValue>
                </TransactionProperty>
              )}
              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("transaction_from")}
                </PropertyName>
                <PropertyValue>{formatAddress(activeAddress, 6)}</PropertyValue>
              </TransactionProperty>
              {recipient && (
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_to")}
                  </PropertyName>
                  <PropertyValue>{formatAddress(recipient, 6)}</PropertyValue>
                </TransactionProperty>
              )}

              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("transaction_fee")}
                </PropertyName>
                <PropertyValue>0 AR</PropertyValue>
              </TransactionProperty>
              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("transaction_size")}
                </PropertyName>
                <PropertyValue>
                  {prettyBytes(params?.data.data.length)}
                </PropertyValue>
              </TransactionProperty>
              <Spacer y={0.1} />
              <PropertyName
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                onClick={() => setShowTags(!showTags)}
              >
                {browser.i18n.getMessage("transaction_tags")}
                {showTags ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </PropertyName>
              <Spacer y={0.05} />
              {showTags &&
                params?.data?.tags?.map((tag, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>{tag.name}</PropertyName>
                    <TagValue>{tag.value}</TagValue>
                  </TransactionProperty>
                ))}
            </Properties>
          </Section>
        ) : (
          <Loading />
        )}
      </div>
      <Section>
        {password && (
          <>
            <PasswordWrapper style={{ paddingTop: 0 }}>
              <InputV2
                placeholder="Enter your password"
                small
                {...passwordInput.bindings}
                label={"Password"}
                type="password"
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  await sign();
                }}
                fullWidth
              />
            </PasswordWrapper>
            <Spacer y={1} />
          </>
        )}
        <ButtonV2
          fullWidth
          onClick={sign}
          disabled={(password && !passwordInput.state) || loading}
        >
          {browser.i18n.getMessage("signature_authorize")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const Description = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const PasswordWrapper = styled.div`
  display: flex;
  padding-top: 16px;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
