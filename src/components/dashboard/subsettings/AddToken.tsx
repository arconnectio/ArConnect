import { Input, Label, useInput, useToasts } from "@arconnect/components";
import { Button, Select, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { useAo, type TokenInfo, useAoTokens } from "~tokens/aoTokens/ao";
import { getTokenInfo } from "~tokens/aoTokens/router";
import styled from "styled-components";
import { isAddress } from "~utils/assertions";
import { getAoTokens, getDreForToken } from "~tokens";
import { ExtensionStorage } from "~utils/storage";
import { SubTitle } from "./ContactSettings";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import type { TokenState } from "~tokens/token";

export default function AddToken() {
  const targetInput = useInput();
  const warpInput = useInput();
  const [token, setToken] = useState<TokenInfo>();
  const [type, setType] = useState<string>("ao");
  const ao = useAo();
  const { setToast } = useToasts();

  const onImportToken = async () => {
    try {
      const tokens = await getAoTokens();

      if (tokens.find((token) => token.processId === targetInput.state)) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("token_already_added"),
          duration: 3000
        });
        throw new Error("Token already added");
      }

      tokens.push({ ...token, processId: targetInput.state });
      await ExtensionStorage.set("ao_tokens", tokens);
      setToast({
        type: "success",
        content: browser.i18n.getMessage("token_imported"),
        duration: 3000
      });
    } catch (err) {
      console.log("err", err);
    }
  };

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        //TODO double check
        isAddress(targetInput.state);
        if (type === "ao") {
          const tokenInfo = await getTokenInfo(targetInput.state, ao);
          setToken(tokenInfo);
        } else {
          let dre = await getDreForToken(warpInput.state);
          console.log("dres", dre);
          const contract = new DREContract(warpInput.state, new DRENode(dre));
          const { state } = await contract.getState<TokenState>();
          console.log("state", state);
        }
      } catch (err) {
        console.log("herr", err);
      }
    };
    fetchTokenInfo();
  }, [targetInput.state]);

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        //TODO double check
        isAddress(warpInput.state);
        console.log("add", warpInput.state);

        let dre = await getDreForToken(warpInput.state);
        console.log("dres", dre);
        const contract = new DREContract(warpInput.state, new DRENode(dre));
        const { state } = await contract.getState<TokenState>();
        console.log("state", state);
        // setToken(tokenInfo);
      } catch (err) {
        console.log("herer", err);
      }
    };
    fetchTokenInfo();
  }, [warpInput.state]);

  return (
    <Wrapper>
      <div>
        <Spacer y={0.45} />
        <Title>{browser.i18n.getMessage("import_token")}</Title>
        <Select
          label={browser.i18n.getMessage("token_type")}
          onChange={(e) => {
            // @ts-expect-error
            setType(e.target.value);
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
          <Select
            label={browser.i18n.getMessage("token_type")}
            onChange={(e) => {}}
            fullWidth
          >
            <option>{browser.i18n.getMessage("token_type_asset")}</option>
            <option>{browser.i18n.getMessage("token_type_collectible")}</option>
          </Select>
        )}

        <Spacer y={0.5} />
        <Input
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
          </TokenWrapper>
        )}
      </div>
      <Button disabled={!token} onClick={onImportToken}>
        Add Token
      </Button>
    </Wrapper>
  );
}

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
