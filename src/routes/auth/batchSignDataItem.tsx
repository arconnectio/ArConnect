import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { ButtonV2, ListItem, Section, Text } from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useRef, useState } from "react";
import styled from "styled-components";

import { ResetButton } from "~components/dashboard/Reset";
import SignDataItemDetails from "~components/signDataItem";
import HeadV2 from "~components/popup/HeadV2";

interface Tag {
  name: string;
  value: string;
}

interface DataStructure {
  data: number[];
  target?: string;
  tags: Tag[];
}

export default function BatchSignDataItem() {
  // connect params
  const params = useAuthParams<{
    appData: { appURL: string };
    data: DataStructure;
  }>();

  const { closeWindow, cancel } = useAuthUtils(
    "batchSignDataItem",
    params?.authID
  );

  // sign message

  const [transaction, setTransaction] = useState<any | null>(null);
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
          title={browser.i18n.getMessage("batch_sign_items")}
          showOptions={false}
          back={() => (transaction ? setTransaction(null) : cancel())}
        />
        <Description>
          <Text noMargin>
            {browser.i18n.getMessage(
              "batch_sign_data_description",
              params?.appData.appURL
            )}
          </Text>
        </Description>

        {transaction ? (
          <SignDataItemDetails params={transaction} />
        ) : (
          <div style={{ paddingLeft: "16px", paddingRight: "16px" }}>
            {Array.isArray(params?.data) &&
              params.data.map((item, index) => {
                return (
                  <ListItem
                    title={`Transaction ${index + 1}`}
                    description={formatTransactionDescription(item.tags)}
                    small
                    onClick={() => setTransaction(item)}
                  />
                );
              })}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "16px"
        }}
      >
        {!transaction ? (
          <>
            <ButtonV2 fullWidth onClick={sign}>
              {browser.i18n.getMessage("signature_authorize")}
            </ButtonV2>
            <ResetButton fullWidth onClick={cancel}>
              {browser.i18n.getMessage("cancel")}
            </ResetButton>
          </>
        ) : (
          <ButtonV2 fullWidth onClick={() => setTransaction(null)}>
            {browser.i18n.getMessage("continue")}
          </ButtonV2>
        )}
      </div>
    </Wrapper>
  );
}

function formatTransactionDescription(tags: Tag[]): string {
  console.log("tags", tags);
  const actionTag = tags.find((tag) => tag.name === "Action");
  console.log("action", actionTag);
  if (actionTag) {
    if (actionTag.value === "Transfer") {
      const sentTag = tags.find((tag) => tag.name === "Sent");
      const fromProcessTag = tags.find((tag) => tag.name === "From-Process");
      if (sentTag && fromProcessTag) {
        return `Sending ${sentTag.value} of ${fromProcessTag.value}`;
      }
    } else {
      try {
        const actionData = JSON.parse(actionTag.value);
        if (actionData.cmd === "register") {
          return `Registering beaver ${actionData.beaverId} with balance ${actionData.balance}`;
        }
      } catch (e) {
        // If JSON parsing fails, we'll fall through to the default return
      }
    }
  }
  return "Unknown transaction";
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
