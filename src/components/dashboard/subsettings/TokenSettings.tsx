import { Button, Select, Spacer, Text } from "@arconnect/components";
import type { Token, TokenType } from "~tokens/token";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { AnimatePresence } from "framer-motion";
import { TrashIcon } from "@iconicicons/react";
import { removeToken } from "~tokens";
import { useMemo } from "react";
import CustomGatewayWarning from "~components/auth/CustomGatewayWarning";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function TokenSettings({ id }: Props) {
  // tokens
  const [tokens, setTokens] = useStorage<Token[]>(
    {
      key: "tokens",
      instance: ExtensionStorage
    },
    []
  );

  // ao tokens
  const [aoTokens] = useStorage<any[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  // Combine regular and AO tokens to find the current token
  const token = useMemo(() => {
    const allTokens = [
      ...tokens,
      ...aoTokens.map((aoToken) => ({
        ...aoToken,
        id: aoToken.processId,
        name: aoToken.Name,
        ticker: aoToken.Ticker
      }))
    ];

    return allTokens.find((t) => t.id === id);
  }, [tokens, aoTokens, id]);

  // update token type
  function updateType(type: TokenType) {
    setTokens((allTokens) => {
      const tokenIndex = allTokens.findIndex((t) => t.id === id);
      if (tokenIndex !== -1) {
        allTokens[tokenIndex].type = type;
      }
      return [...allTokens];
    });
  }

  if (!token) return null;

  return (
    <Wrapper>
      <div>
        <Spacer y={0.45} />
        <TokenName>{token.name}</TokenName>
        <Spacer y={0.5} />
        <Select
          label={browser.i18n.getMessage("token_type")}
          onChange={(e) => {
            // @ts-expect-error
            updateType(e.target.value as TokenType);
          }}
          fullWidth
        >
          <option value="asset" selected={token.type === "asset"}>
            {browser.i18n.getMessage("token_type_asset")}
          </option>
          <option value="collectible" selected={token.type === "collectible"}>
            {browser.i18n.getMessage("token_type_collectible")}
          </option>
        </Select>
        <AnimatePresence>
          {token.gateway && <CustomGatewayWarning />}
        </AnimatePresence>
      </div>
      <Button onClick={() => removeToken(id)}>
        <TrashIcon />
        {browser.i18n.getMessage("remove_token")}
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const TokenName = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
`;

interface Props {
  id: string;
}
