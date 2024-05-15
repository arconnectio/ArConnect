import { useHistory } from "~utils/hash_router";
import { Section, useToasts } from "@arconnect/components";
import { EditIcon } from "@iconicicons/react";
import { getAoTokens, useTokens } from "~tokens";
import { useMemo } from "react";
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

export default function Tokens() {
  // all tokens
  const tokens = useTokens();
  // ao Tokens
  const [aoTokens] = useAoTokens();

  // ao Tokens Cache
  const [aoTokensCache] = useAoTokensCache();

  const { setToast } = useToasts();

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

      if (aoTokens.find(({ processId }) => processId === token.id)) {
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

      if (!aoTokens.find(({ processId }) => processId === token.id)) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("token_already_removed"),
          duration: 3000
        });
        throw new Error("Token already removed");
      }

      const updatedTokens = aoTokens.filter(
        ({ processId }) => processId !== token.id
      );
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

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("assets")} />
      <TokensList>
        {assets.map((token, i) => (
          <Token
            {...token}
            onClick={() => push(`/token/${token.id}`)}
            onSettings={(e) => {
              e.preventDefault();
              window.open(
                `${browser.runtime.getURL("tabs/dashboard.html")}#/tokens`
              );
            }}
            key={i}
          />
        ))}
        {aoTokens.map((token) => (
          <Token
            key={token.id}
            ao={true}
            type={"asset"}
            defaultLogo={token?.Logo}
            id={token.id}
            onRemove={(e) => {
              e.preventDefault();
              removeAoToken(token);
            }}
            ticker={token.Ticker}
            balance={Number(token.balance)}
            onClick={(e) => {
              e.preventDefault();
              handleTokenClick(token.id);
            }}
          />
        ))}
        {aoTokensCache.map((token) => (
          <Token
            key={token.id}
            ao={true}
            type={"asset"}
            defaultLogo={token?.Logo}
            id={token.id}
            onAdd={(e) => {
              e.preventDefault();
              addAoToken(token);
            }}
            ticker={token.Ticker}
            balance={Number(token.balance || null)}
            onClick={(e) => {
              e.preventDefault();
              handleTokenClick(token.id);
            }}
          />
        ))}
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
  rel: "noopener noreferer",
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
