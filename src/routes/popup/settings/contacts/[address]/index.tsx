import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { default as ContactSettingsComponent } from "~components/dashboard/subsettings/ContactSettings";
import styled from "styled-components";
import { useLocation } from "wouter";

interface ContactSettingsProps {
  address: string;
}

export default function ContactSettings({ address }: ContactSettingsProps) {
  const [, setLocation] = useLocation();

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("setting_contact")}
        back={() => setLocation("/quick-settings/contacts")}
      />
      <Wrapper>
        <ContactSettingsComponent address={address} isQuickSetting={true} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 70px);
`;
