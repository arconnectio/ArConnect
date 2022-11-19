import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import type { TokenState } from "~tokens/token";
import { getTokenLogo } from "~lib/viewblock";
import { useEffect, useRef, useState } from "react";
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

  // add the token
  async function addToken() {
    // TODO: add token

    // reply to request
    await replyToAuthRequest("token", params.authID);

    // close the window
    closeWindow();
  }

  // load state
  const [state, setState] = useState<TokenState>();
  const sandbox = useRef<HTMLIFrameElement>();

  useEffect(() => {
    if (!params?.tokenID || !sandbox.current) {
      return;
    }

    // load state using a sandboxed page
    const resultListener = (e: MessageEvent<TokenState>) => {
      console.log(e);
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

    window.addEventListener("message", resultListener);
    sandbox.current.addEventListener("load", sandboxLoadListener);

    return () => {
      window.removeEventListener("message", resultListener);
      sandbox.current.removeEventListener("load", sandboxLoadListener);
    };
  }, [params?.tokenID, sandbox]);

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
        <PriceChart
          token={{
            name: state?.name || state?.ticker || "",
            ticker: state?.ticker || "",
            logo: getTokenLogo(params?.tokenID || "", "dark")
          }}
          priceData={[0, 2, 3, 4, 3, 5, 1, 2]}
          latestPrice={0}
        >
          <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
        </PriceChart>
      </div>
      <Section>
        <Button fullWidth onClick={addToken}>
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
