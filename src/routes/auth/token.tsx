import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  Button,
  Section,
  Spacer,
  Text,
  useToasts
} from "@arconnect/components";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { getTokenLogo } from "~lib/viewblock";
import { useRef, useState } from "react";
import { addToken } from "~tokens";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import PriceChart from "~components/popup/asset/PriceChart";
import useSandboxedTokenState from "~tokens/hook";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";

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
  const sandbox = useRef<HTMLIFrameElement>();
  const state = useSandboxedTokenState(params?.tokenID, sandbox);

  // toasts
  const { setToast } = useToasts();

  // loading
  const [loading, setLoading] = useState(false);

  // add the token
  async function done() {
    setLoading(true);

    try {
      // get token type
      const data = await fetch(
        `${concatGatewayURL(defaultGateway)}/${params.tokenID}`
      );

      // add the token
      await addToken(
        params.tokenID,
        data.headers.get("content-type").includes("application/json")
          ? "asset"
          : "collectible",
        state
      );

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
          {state && (
            <motion.div
              variants={chartAnimation}
              initial="hidden"
              animate="shown"
              exit="hidden"
            >
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
