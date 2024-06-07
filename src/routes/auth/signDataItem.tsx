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
  TagValue
} from "~routes/popup/transaction/[id]";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type { TokenInfo } from "~tokens/aoTokens/ao";

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

  const parentRef = useRef(null);
  const childRef = useRef(null);
  const [password, setPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenName, setTokenName] = useState<string>("");
  const [amount, setAmount] = useState<Quantity | null>(null);
  const { setToast } = useToasts();

  const quantity =
    params?.data?.tags.find((tag) => tag.name === "Quantity")?.value || "0";
  const process = params?.data?.target;

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
      try {
        setLoading(true);
        const token = await Token(params.data.target);

        const tokenAmount = new Quantity(
          BigInt(quantity),
          token.info.Denomination
        );
        setTokenName(token.info.Name);
        setAmount(tokenAmount);
      } catch (err) {
        // fallback
        console.log("err", err);
        try {
          const aoTokens =
            (await ExtensionStorage.get<(TokenInfo & { processId: string })[]>(
              "ao_tokens"
            )) || [];
          const aoTokensCache =
            (await ExtensionStorage.get<(TokenInfo & { processId: string })[]>(
              "ao_tokens_cache"
            )) || [];
          const aoTokensCombined = [...aoTokens, ...aoTokensCache];
          const token = aoTokensCombined.find(
            ({ processId }) => params.data.target === processId
          );
          if (token) {
            const tokenAmount = new Quantity(
              BigInt(quantity),
              BigInt(token.Denomination)
            );
            setTokenName(token.Name);
            setAmount(tokenAmount);
          }
        } catch {}
      } finally {
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
    if (!amount || !parentRef.current || !childRef.current) return;

    const parentWidth = parentRef.current.offsetWidth;
    const newFontSize = parentWidth * 0.05;
    childRef.current.style.fontSize = `${newFontSize}px`;
  }, [amount]);

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
            <FiatAmount>{formatFiatBalance(fiatPrice, currency)}</FiatAmount>
            <AmountTitle
              ref={childRef}
              style={{
                display: "flex",
                flexWrap: "wrap",
                marginLeft: "auto",
                justifyContent: "center",
                marginBottom: "16px"
              }}
            >
              {(amount || 0).toLocaleString()}
              {!loading ? (
                <span>{tokenName}</span>
              ) : (
                <Loading style={{ width: "16px", height: "16px" }} />
              )}
            </AmountTitle>
            <Properties>
              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("transaction_from")}
                </PropertyName>
                <PropertyValue>{formatAddress(activeAddress, 6)}</PropertyValue>
              </TransactionProperty>
              {params?.data?.target && (
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_to")}
                  </PropertyName>
                  <PropertyValue>
                    {formatAddress(params?.data.target, 6)}
                  </PropertyValue>
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
              <PropertyName>
                {browser.i18n.getMessage("transaction_tags")}
              </PropertyName>
              <Spacer y={0.05} />
              {params?.data.tags.map((tag, i) => (
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
