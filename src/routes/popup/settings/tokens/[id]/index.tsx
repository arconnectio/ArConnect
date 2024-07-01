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
import { TrashIcon } from "@iconicicons/react";
import { removeToken } from "~tokens";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { formatAddress } from "~utils/format";
import { CopyButton } from "~components/dashboard/subsettings/WalletSettings";
import HeadV2 from "~components/popup/HeadV2";
import { useLocation } from "wouter";

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

  const [, setLocation] = useLocation();

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
    <>
      <HeadV2 title={token.name} />
      <Wrapper>
        <div>
          <Spacer y={0.45} />
          <Property>
            <PropertyName>Symbol:</PropertyName>
            <PropertyValue>{token.ticker}</PropertyValue>
          </Property>
          <TokenAddress>
            <Property>
              <PropertyName>Address:</PropertyName>
              <PropertyValue>{formatAddress(token.id, 8)}</PropertyValue>
            </Property>
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
          {!isAoToken && (
            <SelectV2
              small
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
              <option
                value="collectible"
                selected={token.type === "collectible"}
              >
                {browser.i18n.getMessage("token_type_collectible")}
              </option>
            </SelectV2>
          )}
        </div>
        <ButtonV2
          fullWidth
          onClick={async () => {
            await removeToken(id);
            setLocation(`/quick-settings/tokens`);
          }}
          style={{ backgroundColor: "#8C1A1A" }}
        >
          <TrashIcon style={{ marginRight: "5px" }} />
          {browser.i18n.getMessage("remove_token")}
        </ButtonV2>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 80px);
`;

const TokenAddress = styled(Text).attrs({
  margin: true
})`
  margin-top: 12px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.37rem;
`;

interface Props {
  id: string;
}

const Property = styled.div`
  display: flex;
  gap: 4px;
`;

const BasePropertyText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 1rem;
  font-weight: 500;
`;

const PropertyName = styled(BasePropertyText)``;

const PropertyValue = styled(BasePropertyText)`
  color: rgb(${(props) => props.theme.primaryText});
`;
