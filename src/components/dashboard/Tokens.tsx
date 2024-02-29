import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useLocation, useRoute } from "wouter";
import { useEffect, useMemo, useState } from "react";
import type { Token, TokenType } from "~tokens/token";
import { Reorder } from "framer-motion";
import TokenListItem from "./list/TokenListItem";
import styled from "styled-components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import browser from "webextension-polyfill";
import { Button, Label, Spacer, Text } from "@arconnect/components";
import { useAoTokens } from "~tokens/aoTokens/ao";

export default function Tokens() {
  // tokens
  const [tokens, setTokens] = useStorage<Token[]>(
    {
      key: "tokens",
      instance: ExtensionStorage
    },
    []
  );

  const [aoTokens] = useAoTokens();

  const enhancedAoTokens = useMemo(() => {
    return aoTokens.map((token) => ({
      id: token.id,
      defaultLogo: token.Logo,
      balance: token.balance,
      ticker: token.Ticker,
      type: "asset" as TokenType,
      name: token.Name
    }));
  }, [aoTokens]);

  const [aoSettingsState, setaoSettingsState] = useState(true);

  useEffect(() => {
    (async () => {
      const currentSetting = await ExtensionStorage.get<boolean>(
        "setting_ao_support"
      );
      setaoSettingsState(currentSetting);
    })();
  }, []);

  const toggleaoSettings = async () => {
    const newSetting = !aoSettingsState;
    setaoSettingsState(newSetting);
    await ExtensionStorage.set("setting_ao_support", newSetting);
  };

  // router
  const [matches, params] = useRoute<{ id?: string }>("/tokens/:id?");
  const [, setLocation] = useLocation();

  // active subsetting val
  const activeTokenSetting = useMemo(
    () => (params?.id ? params.id : undefined),
    [params]
  );

  useEffect(() => {
    if (activeTokenSetting === "new") {
      return;
    }
    if (!matches) return;

    const firstToken = tokens?.[0];

    // return if there is a wallet present in params
    if (
      !firstToken ||
      (!!activeTokenSetting && !!tokens.find((w) => w.id == activeTokenSetting))
    ) {
      return;
    }

    setLocation("/tokens/" + firstToken.id);
  }, [tokens, activeTokenSetting]);

  const addToken = () => {
    setLocation("/tokens/new");
  };

  return (
    <Wrapper>
      <div>
        <PermissionCheckbox
          checked={aoSettingsState}
          onChange={toggleaoSettings}
          style={{ padding: "0 9.6px" }}
        >
          {browser.i18n.getMessage(!!aoSettingsState ? "enabled" : "disabled")}
          <br />
          <Text noMargin>
            {browser.i18n.getMessage("setting_ao_support_description")}
          </Text>
        </PermissionCheckbox>
        <Spacer y={1.7} />
        <Reorder.Group
          as="div"
          axis="y"
          onReorder={setTokens}
          values={tokens}
          style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          {tokens.map((token) => (
            <TokenListItem
              token={token}
              active={activeTokenSetting === token.id}
              key={token.id}
            />
          ))}
          <Spacer y={2} />
          {enhancedAoTokens.length > 0 && (
            <>
              <Label style={{ paddingLeft: "4px", margin: "0" }}>
                ao tokens
              </Label>
              {enhancedAoTokens.map((token) => (
                <TokenListItem
                  token={token}
                  ao={true}
                  active={activeTokenSetting === token.id}
                  key={token.id}
                />
              ))}
            </>
          )}
        </Reorder.Group>
      </div>
      <Button fullWidth onClick={addToken} disabled={!aoSettingsState}>
        {browser.i18n.getMessage("import_token")}
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - 64px);
`;
