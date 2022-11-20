import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import { getInitialState, TokenState } from "~tokens/token";
import { defaultGateway } from "~applications/gateway";
import { useEffect, useRef, useState } from "react";
import { getTokenLogo } from "~lib/viewblock";
import { addToken } from "~tokens";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import PriceChart from "~components/popup/asset/PriceChart";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";

export default function Token() {
  // connect params
  const params = useAuthParams<{
    url: string;
    tokenID: string;
  }>();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("token", params?.authID);

  // price period
  const [period, setPeriod] = useState("Day");

  // load state
  const [state, setState] = useState<TokenState>();
  const sandbox = useRef<HTMLIFrameElement>();

  useEffect(() => {
    // load state using a sandboxed page
    const resultListener = (e: MessageEvent<TokenState>) => {
      setState(e.data);
    };

    // send message to iframe
    const sandboxLoadListener = () => {
      sandbox.current.contentWindow.postMessage(
        {
          fn: "getContractState",
          params: [params.tokenID]
        },
        "*"
      );
    };

    (async () => {
      if (!params?.tokenID || !sandbox.current) {
        return;
      }

      // load initial state
      const initialState = await getInitialState(
        params.tokenID,
        defaultGateway
      );

      if (!!state) return;
      setState(initialState as any);
    })();

    window.addEventListener("message", resultListener);
    sandbox.current.addEventListener("load", sandboxLoadListener);

    return () => {
      window.removeEventListener("message", resultListener);
      sandbox.current.removeEventListener("load", sandboxLoadListener);
    };
  }, [params?.tokenID, sandbox]);

  // add the token
  async function done() {
    // add the token
    await addToken(params.tokenID, state);

    // reply to request
    await replyToAuthRequest("token", params.authID);

    // close the window
    closeWindow();
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
        {state && (
          <PriceChart
            token={{
              name: state.name || state.ticker || "",
              ticker: state.ticker || "",
              logo: getTokenLogo(params.tokenID || "", "dark")
            }}
            priceData={[0, 0, 0, 0]}
            latestPrice={0}
          >
            <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
          </PriceChart>
        )}
      </div>
      <Section>
        <Button fullWidth onClick={done}>
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
