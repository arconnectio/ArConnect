import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { Button, Card, Section, Spacer, Text } from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Signature() {
  // connect params
  const params = useAuthParams<{
    url: string;
    message: number[];
  }>();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signature", params?.authID);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, []);

  // sign message
  async function sign() {
    // send response
    await replyToAuthRequest("signature", params.authID);

    // close the window
    closeWindow();
  }

  // message decode type
  const [decodeType, setDecodeType] = useState("UTF-8");
  const availableDecodeTypes = [
    "utf-8",
    "hex",
    "ibm866",
    "mac",
    "windows-1251",
    "gbk",
    "utf-16"
  ];

  // current message
  const message = useMemo(() => {
    if (typeof params?.message === "undefined") return "";
    const messageBytes = new Uint8Array(params.message);

    // handle hex
    if (decodeType === "hex") {
      return [...new Uint8Array(messageBytes.buffer)]
        .map((v) => "0x" + v.toString(16).padStart(2, "0"))
        .join(" ");
    }

    // handle other types
    return new TextDecoder(decodeType).decode(messageBytes);
  }, [params?.message, decodeType]);

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("titles_signature")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("signature_description", params?.url)}
          </Text>
        </Section>
      </div>
      <Section>
        <MessageHeader>
          <Text noMargin>{browser.i18n.getMessage("signature_message")}</Text>
          <EncodingSelect onChange={(e) => setDecodeType(e.target.value)}>
            {availableDecodeTypes.map((type, i) => (
              <option value={type} key={i} selected={type === decodeType}>
                {type}
              </option>
            ))}
          </EncodingSelect>
        </MessageHeader>
        <Spacer y={0.3} />
        <Card smallPadding>
          <MessageText>{message}</MessageText>
        </Card>
        <Spacer y={1.25} />
        <Button fullWidth onClick={sign}>
          {browser.i18n.getMessage("signature_authorize")}
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
