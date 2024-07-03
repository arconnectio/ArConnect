import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import type { Token, TokenType } from "~tokens/token";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { ButtonV2, Spacer, useInput } from "@arconnect/components";
import { type TokenInfoWithBalance } from "~tokens/aoTokens/ao";
import HeadV2 from "~components/popup/HeadV2";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import { loadTokenLogo } from "~tokens/token";
import { formatAddress } from "~utils/format";
import { getDreForToken } from "~tokens";
import { useTheme } from "~utils/theme";
import * as viewblock from "~lib/viewblock";
import { useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { getUserAvatar } from "~lib/avatar";
import SearchInput from "~components/dashboard/SearchInput";

export default function Tokens() {
  // tokens
  const [tokens] = useStorage<Token[]>(
    {
      key: "tokens",
      instance: ExtensionStorage
    },
    []
  );

  const [aoTokens] = useStorage<TokenInfoWithBalance[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const enhancedAoTokens = useMemo(() => {
    return aoTokens.map((token) => ({
      id: token.processId,
      defaultLogo: token.Logo,
      balance: "0",
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

  // router
  const [, setLocation] = useLocation();

  // search
  const searchInput = useInput();

  // search filter function
  function filterSearchResults(token: Token) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.ticker.toLowerCase().includes(query.toLowerCase())
    );
  }

  const addToken = () => {
    setLocation("/quick-settings/tokens/new");
  };

  const handleTokenClick = (token: {
    id: any;
    defaultLogo?: string;
    balance?: string;
    ticker?: string;
    type?: TokenType;
    name?: string;
  }) => {
    setLocation(`/quick-settings/tokens/${token.id}`);
  };

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("setting_tokens")}
        back={() => setLocation("/quick-settings")}
      />
      <Wrapper>
        <div>
          <SearchInput
            small
            placeholder={browser.i18n.getMessage("search_tokens")}
            {...searchInput.bindings}
          />
          <Spacer y={1} />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Label style={{ paddingLeft: "4px", margin: "0" }}>
              {browser.i18n.getMessage("assets")}
            </Label>
            {tokens.filter(filterSearchResults).map((token) => (
              <TokenListItem token={token} active={false} key={token.id} />
            ))}

            {enhancedAoTokens.length > 0 && aoSettingsState && (
              <>
                <Label style={{ paddingLeft: "4px", margin: "0" }}>
                  {browser.i18n.getMessage("ao_tokens")}
                </Label>
                {enhancedAoTokens.filter(filterSearchResults).map((token) => (
                  <div onClick={() => handleTokenClick(token)} key={token.id}>
                    <TokenListItem
                      token={token}
                      ao={true}
                      active={false}
                      key={token.id}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <ActionBar>
          <ButtonV2 fullWidth onClick={addToken}>
            {browser.i18n.getMessage("import_token")}
          </ButtonV2>
        </ActionBar>
      </Wrapper>
    </>
  );
}

function TokenListItem({ token, ao, onClick }: Props) {
  // format address
  const formattedAddress = useMemo(
    () => formatAddress(token.id, 8),
    [token.id]
  );

  // display theme
  const theme = useTheme();

  // token logo
  const [image, setImage] = useState(viewblock.getTokenLogo(token.id));

  // gateway
  const gateway = useGateway({ startBlock: 0 });

  useEffect(() => {
    (async () => {
      try {
        // if it is a collectible, we don't need to determinate the logo
        if (token.type === "collectible") {
          return setImage(
            `${concatGatewayURL(token.gateway || gateway)}/${token.id}`
          );
        }
        if (ao) {
          if (token.defaultLogo) {
            const logo = await getUserAvatar(token.defaultLogo);
            return setImage(logo);
          } else {
            return setImage(arLogoDark);
          }
        }

        // query community logo using Warp DRE
        const node = new DRENode(await getDreForToken(token.id));
        const contract = new DREContract(token.id, node);
        const result = await contract.query<[string]>(
          "$.settings.[?(@[0] === 'communityLogo')][1]"
        );

        setImage(await loadTokenLogo(token.id, result[0], theme));
      } catch {
        setImage(viewblock.getTokenLogo(token.id));
      }
    })();
  }, [token, theme, gateway, ao]);

  // router
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setLocation(`/quick-settings/tokens/${token.id}`);
    }
  };

  return (
    <ListItem id={token.id} onClick={handleClick}>
      <TokenLogo src={image} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <TitleWrapper>{token.name}</TitleWrapper>
        <DescriptionWrapper>
          {formattedAddress}
          {ao && <Image src={aoLogo} alt="ao logo" />}
          {!ao && <TokenType>{token.type}</TokenType>}
        </DescriptionWrapper>
      </div>
    </ListItem>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 70px);
`;

const Label = styled.p`
  font-size: 0.7rem;
  font-weight: 600;
  color: rgb(${(props) => props.theme.primaryText});
  margin: 0;
  margin-bottom: 0.8em;
`;

const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  background-color: rgb(${(props) => props.theme.background});
`;

const Image = styled.img`
  width: 12px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  gap: 8px;
  font-size: 0.625rem;
  color: ${(props) => props.theme.secondaryTextv2};
`;

const TitleWrapper = styled.div`
  font-size: 1rem;
  font-weight: 600;
`;

const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.secondaryItemHover};
  }
`;

const TokenLogo = styled.img.attrs({
  alt: "token-logo",
  draggable: false
})`
  width: 2rem;
  height: 2rem;
`;

const TokenType = styled.span`
  padding: 0.08rem 0.2rem;
  background-color: rgb(${(props) => props.theme.theme});
  color: #fff;
  font-weight: 500;
  font-size: 0.5rem;
  text-transform: uppercase;
  margin-left: 0.45rem;
  width: max-content;
  border-radius: 5px;
`;

interface Props {
  token: Token;
  ao?: boolean;
  active: boolean;
  onClick?: () => void;
}
