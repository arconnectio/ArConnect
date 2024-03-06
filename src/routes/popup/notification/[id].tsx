import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function MessageNotification({ id, message }: Props) {
  const [aoMessage, setAoMessage] = useState(null);

  useEffect(() => {
    if (message) {
      const parsedMessage = JSON.parse(decodeURIComponent(message));
      setAoMessage(parsedMessage);
    }
  }, [message]);

  // Function to filter tags based on specified names
  const filterTagsByName = (tags) => {
    return tags.filter((tag) =>
      ["Quantity", "Action", "Data-Protocol", "Type"].includes(tag.name)
    );
  };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("signature_message")} />
      <Wrapper key={id}>
        {aoMessage &&
          filterTagsByName(aoMessage.node.tags).map((tag, index) => (
            <Message key={index}>
              {tag.name}: {tag.value}
            </Message>
          ))}
      </Wrapper>
    </>
  );
}

interface Props {
  id: string;
  message: string;
}

const Wrapper = styled.div`
  width: 100%;
  margin-top: 3px;
  padding: 0px 15px 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Message = styled.div`
  width: calc(100% - 30px);
  height: calc(100% - 64.59px);
  font-size: 14px;
  color: ${(props) => props.theme.primaryTextv2};
  gap: 12px;
`;
