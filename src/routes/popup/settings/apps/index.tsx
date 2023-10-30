import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Apps() {
  // router push
  const [push] = useHistory();

  return (
    <>
      <Head title={browser.i18n.getMessage("setting_apps")} />
      <Wrapper></Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
