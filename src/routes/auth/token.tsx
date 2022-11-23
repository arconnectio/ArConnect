import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TokenType } from "~tokens/token";
import { getTokenLogo } from "~lib/viewblock";
import { addToken } from "~tokens";
import {
  concatGatewayURL,
  defaultGateway,
  Gateway
} from "~applications/gateway";
import {
  Button,
  Section,
  Spacer,
  Text,
  useToasts
} from "@arconnect/components";
import CustomGatewayWarning from "~components/auth/CustomGatewayWarning";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import PriceChart from "~components/popup/asset/PriceChart";
import Thumbnail from "~components/popup/asset/Thumbnail";
import useSandboxedTokenState from "~tokens/hook";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Title from "~components/popup/Title";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Token() {
  // connect params
  const params = useAuthParams<{
    url: string;
    tokenID: string;
    tokenType?: TokenType;
    gateway?: Gateway;
  }>();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("token", params?.authID);

  // price period
  const [period, setPeriod] = useState("Day");

  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const state = useSandboxedTokenState(params?.tokenID, sandbox);

  // token settings
  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return new Map(state.settings);
  }, [state]);

  // toasts
  const { setToast } = useToasts();

  // loading
  const [loading, setLoading] = useState(false);

  // load type
  const [tokenType, setTokenType] = useState<TokenType>();

  useEffect(() => {
    (async () => {
      if (!params?.tokenID) return;

      // get token type
      let type = params.tokenType;

      if (!type) {
        // fetch data
        const data = await fetch(
          `${concatGatewayURL(defaultGateway)}/${params.tokenID}`
        );

        type = data.headers.get("content-type").includes("application/json")
          ? "asset"
          : "collectible";
      }

      setTokenType(type);
    })();
  }, [params?.tokenID]);

  // add the token
  async function done() {
    if (!params?.tokenID || !tokenType || !state || !params) {
      return;
    }

    setLoading(true);

    try {
      // add the token
      await addToken(params.tokenID, tokenType, state, params.gateway);

      // reply to request
      await replyToAuthRequest("token", params.authID);

      // close the window
      closeWindow();
    } catch (e) {
      console.log("Failed to add token", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("token_add_failure"),
        duration: 2200
      });
    }

    setLoading(false);
  }

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("addToken")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("addTokenParagraph", params?.url)}
          </Text>
        </Section>
        <AnimatePresence>
          {!!params?.gateway && <CustomGatewayWarning />}
        </AnimatePresence>
        <AnimatePresence>
          {state && tokenType && (
            <motion.div
              variants={chartAnimation}
              initial="hidden"
              animate="shown"
              exit="hidden"
            >
              {(tokenType === "asset" && (
                <PriceChart
                  token={{
                    name: state.name || state.ticker || "",
                    ticker: state.ticker || "",
                    logo: getTokenLogo(params.tokenID || "", "dark")
                  }}
                  priceData={[]}
                  latestPrice={0}
                >
                  <PeriodPicker
                    period={period}
                    onChange={(p) => setPeriod(p)}
                  />
                </PriceChart>
              )) || (
                <>
                  <Thumbnail
                    src={`${concatGatewayURL(defaultGateway)}/${
                      params?.tokenID
                    }`}
                  />
                  <Section>
                    <TokenName noMargin>
                      {state.name || state.ticker}{" "}
                      {state.name && (
                        <Ticker>({state.ticker.toUpperCase()})</Ticker>
                      )}
                    </TokenName>
                    <Spacer y={0.15} />
                    <Description>
                      {(settings && settings.get("communityDescription")) ||
                        state.description ||
                        browser.i18n.getMessage("no_description")}
                    </Description>
                  </Section>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Section>
        <Button fullWidth onClick={done} loading={loading}>
          {browser.i18n.getMessage("addToken")}
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
      <iframe
        src={browser.runtime.getURL("tabs/sandbox.html")}
        ref={sandbox}
        style={{ display: "none" }}
      ></iframe>
    </Wrapper>
  );
}

const chartAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const TokenName = styled(Title)`
  display: flex;
  gap: 0.3rem;
`;

const Ticker = styled.span`
  color: rgb(${(props) => props.theme.secondaryText});
`;

const Description = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.98rem;
  text-align: justify;
`;
