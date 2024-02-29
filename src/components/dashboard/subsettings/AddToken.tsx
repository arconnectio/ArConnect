import { Input, Label, useInput, useToasts } from "@arconnect/components";
import { Button, Select, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { useAo, type TokenInfo, useAoTokens } from "~tokens/aoTokens/ao";
import { getTokenInfo } from "~tokens/aoTokens/router";
import styled from "styled-components";
import { isAddress } from "~utils/assertions";
import { getAoTokens } from "~tokens";
import { ExtensionStorage } from "~utils/storage";
import { SubTitle } from "./ContactSettings";

export default function AddToken() {
  const targetInput = useInput();
  const [token, setToken] = useState<TokenInfo>();
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
        const tokenInfo = await getTokenInfo(targetInput.state, ao);
        setToken(tokenInfo);
      } catch (err) {
        console.log("herr", err);
      }
    };
    fetchTokenInfo();
  }, [targetInput.state]);

  return (
    <Wrapper>
      <div>
        <Spacer y={0.45} />
        <Title>{browser.i18n.getMessage("import_token")}</Title>
        <Spacer y={0.5} />
        <Input
          {...targetInput.bindings}
          type="string"
          fullWidth
          placeholder="HineOJKYihQiIcZEWxFtgTyxD_dhDNqGvoBlWj55yDs"
          label="ao process id"
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
