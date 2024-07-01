import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import AddToken from "~components/dashboard/subsettings/AddToken";
import styled from "styled-components";

export default function NewToken() {
  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("import_token")} />
      <Wrapper>
        <AddToken isQuickSetting={true} />
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
