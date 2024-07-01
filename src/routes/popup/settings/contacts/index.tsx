import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { default as ContactsComponent } from "~components/dashboard/Contacts";

export default function Contacts() {
  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_contacts")} />
      <Wrapper>
        <ContactsComponent isQuickSetting={true} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: 100%;
`;
