import {
  ButtonV2,
  SelectV2,
  Spacer,
  Text,
  TooltipV2,
  useToasts
} from "@arconnect/components";
import type { Token, TokenType } from "~tokens/token";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { AnimatePresence } from "framer-motion";
import { TrashIcon } from "@iconicicons/react";
import { removeToken } from "~tokens";
import { useMemo } from "react";
import CustomGatewayWarning from "~components/auth/CustomGatewayWarning";
import { CopyButton } from "./WalletSettings";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { formatAddress } from "~utils/format";

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

  const { setToast } = useToasts();

  const { token, isAoToken } = useMemo(() => {
    const aoToken = aoTokens.find((ao) => ao.processId === id);
    if (aoToken) {
      return {
        token: {
          ...aoToken,
          id: aoToken.processId,
          name: aoToken.Name,
          ticker: aoToken.Ticker
          // Map additional AO token properties as needed
        },
        isAoToken: true
      };
    }
    const regularToken = tokens.find((t) => t.id === id);
    return {
      token: regularToken,
      isAoToken: false
    };
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
      {isAoToken ? (
        <div>
          <TokenName>{token.name} (AO Token)</TokenName>
          <Symbol>Symbol: {token.ticker}</Symbol>
          <TokenAddress>
            Address: {token.id}
            <TooltipV2 content={browser.i18n.getMessage("copy_address")}>
              <CopyButton
                onClick={() => {
                  copy(token.id);
                  setToast({
                    type: "info",
                    content: browser.i18n.getMessage("copied_address", [
                      formatAddress(token.id, 8)
                    ]),
                    duration: 2200
                  });
                }}
              />
            </TooltipV2>
          </TokenAddress>
        </div>
      ) : (
        <div>
          <Spacer y={0.45} />
          <TokenName>{token.name}</TokenName>
          <Spacer y={0.5} />
          <SelectV2
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
          </SelectV2>
          <AnimatePresence>
            {token.gateway && <CustomGatewayWarning />}
          </AnimatePresence>
        </div>
      )}
      <ButtonV2 onClick={() => removeToken(id)}>
        <TrashIcon />
        {browser.i18n.getMessage("remove_token")}
      </ButtonV2>
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

const TokenAddress = styled(Text).attrs({
  margin: true
})`
  font-weight: 500;
  margin-top: 8px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.37rem;
`;

const Symbol = styled(Text).attrs({
  margin: true
})`
  font-weight: 500;
  font-size: 1rem;
  margin-top: 8px;
`;

interface Props {
  id: string;
}
