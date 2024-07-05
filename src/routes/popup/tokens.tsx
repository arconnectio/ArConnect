import { useHistory } from "~utils/hash_router";
import { ButtonV2, Section, useToasts, Loading } from "@arconnect/components";
import { EditIcon } from "@iconicicons/react";
import {
  getAoTokens,
  getAoTokensAutoImportRestrictedIds,
  useTokens
} from "~tokens";
import { useEffect, useMemo, useState } from "react";
import browser from "webextension-polyfill";
import Token from "~components/popup/Token";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import {
  useAoTokens,
  useAoTokensCache,
  type TokenInfoWithBalance
} from "~tokens/aoTokens/ao";
import { ExtensionStorage } from "~utils/storage";
import { syncAoTokens } from "~tokens/aoTokens/sync";
import { useStorage } from "@plasmohq/storage/hook";

export default function Tokens() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  // all tokens
  const tokens = useTokens();
  // ao Tokens
  const [aoTokens] = useAoTokens();

  // ao Tokens Cache
  const [aoTokensCache] = useAoTokensCache();

  const { setToast } = useToasts();

  const [aoSupport] = useStorage<boolean>(
    {
      key: "setting_ao_support",
      instance: ExtensionStorage
    },
    false
  );

  // assets
  const assets = useMemo(
    () => tokens.filter((token) => token.type === "asset"),
    [tokens]
  );

  function handleTokenClick(tokenId: string) {
    push(`/send/transfer/${tokenId}`);
  }

  // router push
  const [push] = useHistory();

  const addAoToken = async (token: TokenInfoWithBalance) => {
    try {
      const aoTokens = await getAoTokens();

      if (aoTokens.some(({ processId }) => processId === token.id)) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("token_already_added"),
          duration: 3000
        });
        throw new Error("Token already added");
      }

      aoTokens.push({
        Name: token.Name,
        Ticker: token.Ticker,
        Denomination: token.Denomination,
        Logo: token.Logo,
        processId: token.id
      });
      await ExtensionStorage.set("ao_tokens", aoTokens);
      setToast({
        type: "success",
        content: browser.i18n.getMessage("token_imported"),
        duration: 3000
      });
    } catch (err) {
      console.log("err", err);
    }
  };

  const removeAoToken = async (token: TokenInfoWithBalance) => {
    try {
      const aoTokens = await getAoTokens();

      if (!aoTokens.some(({ processId }) => processId === token.id)) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("token_already_removed"),
          duration: 3000
        });
        throw new Error("Token already removed");
      }

      const restrictedTokenIds = await getAoTokensAutoImportRestrictedIds();
      const updatedTokens = aoTokens.filter(
        ({ processId }) => processId !== token.id
      );
      if (!restrictedTokenIds.includes(token.id)) {
        restrictedTokenIds.push(token.id);
        await ExtensionStorage.set(
          "ao_tokens_auto_import_restricted_ids",
          restrictedTokenIds
        );
      }
      await ExtensionStorage.set("ao_tokens", updatedTokens);
      setToast({
        type: "success",
        content: browser.i18n.getMessage("token_removed"),
        duration: 3000
      });
    } catch (err) {
      console.log("err", err);
    }
  };

  async function searchAoTokens() {
    if (!aoSupport) return;
    try {
      setIsLoading(true);
      const { hasNextPage } = await syncAoTokens();
      setHasNextPage(!!hasNextPage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (aoSupport) {
      searchAoTokens();
    }
  }, [aoSupport]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("assets")} />
      <TokensList>
        {aoTokens.map((token) => (
          <Token
            key={token.id}
            ao={true}
            type={"asset"}
            defaultLogo={token?.Logo}
            id={token.id}
            ticker={token.Ticker}
            balance={token.balance || "0"}
            onClick={(e) => {
              e.preventDefault();
              handleTokenClick(token.id);
            }}
            onRemoveClick={(e) => {
              e.preventDefault();
              removeAoToken(token);
            }}
          />
        ))}
        {assets.map((token, i) => (
          <Token
            {...token}
            onClick={() => push(`/token/${token.id}`)}
            onSettingsClick={(e) => {
              e.preventDefault();
              window.open(
                `${browser.runtime.getURL("tabs/dashboard.html")}#/tokens`
              );
            }}
            key={i}
          />
        ))}
        {aoTokensCache.map((token) => (
          <Token
            key={token.id}
            ao={true}
            type={"asset"}
            defaultLogo={token?.Logo}
            id={token.id}
            ticker={token.Ticker}
            balance={token.balance || "0"}
            onClick={(e) => {
              e.preventDefault();
              handleTokenClick(token.id);
            }}
            onAddClick={(e) => {
              e.preventDefault();
              addAoToken(token);
            }}
          />
        ))}
        {aoSupport && hasNextPage && (
          <ButtonV2
            disabled={!hasNextPage || isLoading}
            style={{ alignSelf: "center", marginTop: "5px" }}
            onClick={searchAoTokens}
          >
            {isLoading ? (
              <>
                Searching <Loading style={{ margin: "0.18rem" }} />
              </>
            ) : (
              "Search AO tokens"
            )}
          </ButtonV2>
        )}
        <ManageButton
          href={`${browser.runtime.getURL("tabs/dashboard.html")}#/tokens`}
        >
          <EditIcon />
          {browser.i18n.getMessage("manage_assets_button")}
        </ManageButton>
      </TokensList>
    </>
  );
}

const TokensList = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
`;

const ManageButton = styled.a.attrs({
  rel: "noopener noreferrer",
  target: "_blank"
})`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 400;
  padding: 0.55rem 0;
  color: rgb(${(props) => props.theme.theme});
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.85;
  }

  svg {
    font-size: 1em;
    width: 1em;
    height: 1em;
  }
`;
