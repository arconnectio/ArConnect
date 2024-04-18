import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  ButtonV2,
  InputV2,
  ListItem,
  Section,
  Spacer,
  Text,
  useInput
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { svgie } from "~utils/svgies";
import { formatAddress } from "~utils/format";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";

interface Tag {
  name: string;
  value: string;
}

interface DataStructure {
  data: number[];
  tags: Tag[];
}

export default function SignDataItem() {
  // connect params
  const params = useAuthParams<{
    appData: { appURL: string };
    data: DataStructure;
  }>();

  const [password, setPassword] = useState<boolean>(false);

  const recipient =
    params?.data?.tags.find((tag) => tag.name === "Recipient")?.value || "NA";
  const quantity =
    params?.data?.tags.find((tag) => tag.name === "Quantity")?.value || "NA";

  const [signatureAllowance] = useStorage(
    {
      key: "signatureAllowance",
      instance: ExtensionStorage
    },
    10
  );

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signDataItem", params?.authID);

  const passwordInput = useInput();

  const svgieAvatar = useMemo(
    () => svgie(recipient, { asDataURI: true }),
    [recipient]
  );

  useEffect(() => {
    if (signatureAllowance < Number(quantity)) setPassword(true);
  }, [signatureAllowance, quantity]);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [params?.authID]);

  // sign message
  async function sign() {
    // send response
    await replyToAuthRequest("signDataItem", params?.authID);

    // close the window
    closeWindow();
  }

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={browser.i18n.getMessage("sign_item")}
          showOptions={false}
          back={cancel}
        />
        <Description>
          <Text noMargin>
            {browser.i18n.getMessage(
              "sign_data_description",
              params?.appData.appURL
            )}
          </Text>
          <div>
            <ListItem
              small
              disabled
              description={formatAddress(recipient, 10)}
              title={"Recipient"}
              img={svgieAvatar}
              onClick={() =>
                browser.tabs.create({
                  url: `https://viewblock.io/arweave/address/${recipient}`
                })
              }
            />
            {/* TODO: will we have access to process ID? if so would be great to get the token image and redirect to ao scanner */}
            <ListItem
              small
              disabled
              title={"Quantity"}
              description={quantity}
            />
          </div>
        </Description>
        <Spacer y={0.75} />
      </div>
      <Section>
        <Spacer y={1.25} />
        {password && (
          <>
            <PasswordWrapper>
              <InputV2
                placeholder="Enter your password"
                small
                {...passwordInput.bindings}
                label={"Password"}
                type="password"
                fullWidth
              />
            </PasswordWrapper>
            <Spacer y={1} />
          </>
        )}
        <ButtonV2
          fullWidth
          onClick={sign}
          // TODO: Check pw
          disabled={password && !passwordInput.state}
        >
          {browser.i18n.getMessage("signature_authorize")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const Description = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const PasswordWrapper = styled.div`
  display: flex;
  padding-top: 16px;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
