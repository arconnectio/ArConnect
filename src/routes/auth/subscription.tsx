import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  Button,
  Card,
  ListItem,
  Section,
  Spacer,
  Text
} from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";

export default function Subscription() {
  //   connect params
  const params = useAuthParams();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signature", params?.authID);

  // listen for enter to reset
  //   useEffect(() => {
  //     const listener = async (e: KeyboardEvent) => {
  //       if (e.key !== "Enter") return;
  //       await sign();
  //     };

  //     window.addEventListener("keydown", listener);

  //     return () => window.removeEventListener("keydown", listener);
  //   }, [params?.authID]);

  // sign message
  //   async function sign() {
  //     // send response
  //     await replyToAuthRequest("signature", params?.authID);

  //     // close the window
  //     closeWindow();
  //   }

  // message decode type

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={browser.i18n.getMessage("subscription_title")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("subscribe_description")}
          </Text>
        </Section>
        <ListItem title="Turbo Subscription" description="Pending" />
        <Text style={{ padding: "14px" }}>
          Application address: YSykB4NhJHA7jk4
        </Text>
      </div>
      <Section>
        <Spacer y={0.3} />

        <Spacer y={1.25} />
        <Button fullWidth>
          {/* {browser.i18n.getMessage("subscribe")} */}
          Subscribe
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  p,
  select {
    font-size: 0.95rem;
  }
`;

const EncodingSelect = styled.select`
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
  outline: none;
  border: none;
  padding: 0;
  margin: 0;
  background-color: transparent;
`;

const MessageText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
`;
