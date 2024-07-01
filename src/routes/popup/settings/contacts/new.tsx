import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import AddContact from "~components/dashboard/subsettings/AddContact";
import styled from "styled-components";

export default function NewContact() {
  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("new_contact")} />
      <Wrapper>
        <AddContact isQuickSetting={true} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 80px);
`;
