import {
  ButtonV2,
  InputV2,
  SelectV2 as Select,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import { Token } from "ao-tokens";
import styled from "styled-components";
import { isAddress } from "~utils/assertions";
import { addToken, getAoTokens, getDreForToken, useTokens } from "~tokens";
import { ExtensionStorage } from "~utils/storage";
import { SubTitle } from "./ContactSettings";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import type { TokenState, TokenType } from "~tokens/token";
import { concatGatewayURL } from "~gateways/utils";
import { useGateway } from "~gateways/wayfinder";

interface AddTokenProps {
  isQuickSetting?: boolean;
}

export default function AddToken({ isQuickSetting }: AddTokenProps) {
  const targetInput = useInput();
  const gateway = useGateway({ startBlock: 0 });
  const [tokenType, setTokenType] = useState<TokenType>("asset");
  const [token, setToken] = useState<TokenInfo>();
  const [type, setType] = useState<string>("ao");
  const [loading, setLoading] = useState<boolean>(false);
  const [warp, setWarp] = useState<string | null>(null);
  const tokens = useTokens();
  const { setToast } = useToasts();

  const onImportToken = async () => {
    try {
      if (type === "ao") {
        const aoTokens = await getAoTokens();

        if (aoTokens.find((token) => token.processId === targetInput.state)) {
          setToast({
            type: "error",
            content: browser.i18n.getMessage("token_already_added"),
            duration: 3000
          });
          throw new Error("Token already added");
        }

        aoTokens.push({ ...token, processId: targetInput.state });
        await ExtensionStorage.set("ao_tokens", aoTokens);
        setToast({
          type: "success",
          content: browser.i18n.getMessage("token_imported"),
          duration: 3000
        });
      } else if (warp && type === "warp") {
        const existingToken = tokens.find((t) => t.id === targetInput.state);
        if (existingToken) {
          setToast({
            type: "error",
            content: browser.i18n.getMessage("token_already_added"),
            duration: 3000
          });
          throw new Error("Token already added");
        }
        await addToken(targetInput.state, tokenType, warp);
        setToast({
          type: "success",
          content: browser.i18n.getMessage("token_imported"),
          duration: 3000
        });
      }
    } catch (err) {
      console.log("err", err);
    }
  };

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        setLoading(true);
        //TODO double check
        isAddress(targetInput.state);
        if (type === "ao") {
          const token = (await Token(targetInput.state)).info;
          const denomination = Number(token.Denomination.toString());
          const tokenInfo: TokenInfo = { ...token, Denomination: denomination };
          setToken(tokenInfo);
          setLoading(false);
        } else {
          let dre = await getDreForToken(targetInput.state);
          const contract = new DREContract(targetInput.state, new DRENode(dre));
          const { state } = await contract.getState<TokenState>();
          const values: TokenInfo = {
            Name: state.name,
            Ticker: state.ticker,
            Denomination: 0
          };
          setWarp(dre);
          setToken(values);
          setLoading(false);
        }
      } catch (err) {
        setToken(null);
        setLoading(false);
        console.log("err", err);
      }
      setLoading(false);
    };
    fetchTokenInfo();
  }, [targetInput.state, tokenType, type]);

  return (
    <Wrapper>
      <div>
        {!isQuickSetting && (
          <>
            <Spacer y={0.45} />
            <Title>{browser.i18n.getMessage("import_token")}</Title>
          </>
        )}
        <Select
          small={isQuickSetting}
          label={browser.i18n.getMessage("token_type")}
          onChange={(e) => {
            // @ts-expect-error
            setType(e.target.value);
            setTokenType("asset");
          }}
          fullWidth
        >
          <option value="ao" selected={type === "ao"}>
            ao Token
          </option>
          <option value="warp" selected={type === "warp"}>
            Warp Token
          </option>
        </Select>
        {type === "warp" && (
          <>
            <Spacer y={0.5} />
            <Select
              small={isQuickSetting}
              label="Asset/Collectible"
              onChange={(e) => {
                // @ts-expect-error
                setTokenType(e.target.value);
              }}
              fullWidth
            >
              <option selected={tokenType === "asset"} value="asset">
                {browser.i18n.getMessage("token_type_asset")}
              </option>
              <option
                selected={tokenType === "collectible"}
                value="collectible"
              >
                {browser.i18n.getMessage("token_type_collectible")}
              </option>
            </Select>
          </>
        )}

        <Spacer y={0.5} />
        <InputV2
          small={isQuickSetting}
          {...targetInput.bindings}
          type="string"
          fullWidth
          placeholder="HineOJKYihQiIcZEWxFtgTyxD_dhDNqGvoBlWj55yDs"
          label={type === "ao" ? "ao process id" : "Warp Address"}
        />

        {token && (
          <TokenWrapper>
            <SubTitle>TICKER:</SubTitle>
            <Title>{token.Ticker}</Title>
            <SubTitle>NAME:</SubTitle>
            <Title>{token.Name}</Title>
            {tokenType === "collectible" && (
              <Image
                src={concatGatewayURL(gateway) + `/${targetInput.state}`}
              />
            )}
          </TokenWrapper>
        )}
      </div>
      <ButtonV2 fullWidth disabled={!token || loading} onClick={onImportToken}>
        Add Token
      </ButtonV2>
    </Wrapper>
  );
}

const Image = styled.div<{ src: string }>`
  position: relative;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
  padding-top: 100%;
  border-radius: 12px;
`;

const Title = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
  padding-bottom: 10px;
`;

const TokenWrapper = styled.div`
  padding: 36px 0;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;
