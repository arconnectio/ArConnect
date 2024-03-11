import { Checkbox, Spacer, Text } from "@arconnect/components";
import notificationsImage from "url:/assets/setup/notifications-example.svg";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import useSetting from "~settings/hook";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";

export default function Enable() {
  const [notifications, setNotifications] = useStorage<boolean>({
    key: "setting_notifications",
    instance: ExtensionStorage
  });

  useEffect(() => {
    // initializes and saves
    setNotifications(false);
  }, []);

  // Segment

  return (
    <Wrapper>
      <div>
        <Text heading>
          {browser.i18n.getMessage("enable_notifications_title")}
        </Text>
        <Paragraph>
          {browser.i18n.getMessage("enable_notifications_paragraph")}
        </Paragraph>
        <Checkbox
          checked={!!notifications}
          onChange={(checked) => {
            setNotifications(checked);
          }}
        >
          {browser.i18n.getMessage("enabled")}
        </Checkbox>
      </div>
      <Container>
        <Image src={notificationsImage} alt="pin" />
      </Container>
      <Spacer y={1.5} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-direction: column;
  justify-content: space-between;
`;

const Image = styled.img`
  width: 100%;
`;
const Container = styled.div`
  display: flex;
  justify-content: center;
  text-align: center;
`;
