import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import { useState } from "react";
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
  const { closeWindow, cancel } = useAuthUtils("unlock", params?.authID);

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
        <Spacer y={1.5} />
        <PriceChart
          token={{
            name: "Arweave",
            ticker: "AR"
          }}
          priceData={[0, 2, 3, 4, 3, 5, 1, 2]}
          latestPrice={1.12}
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
    </Wrapper>
  );
}
