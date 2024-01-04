import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import browser from "webextension-polyfill";
import SearchInput from "./SearchInput";
import styled from "styled-components";

export default function Contacts() {
  return (
    <Wrapper>
      <SearchInput
        placeholder={browser.i18n.getMessage("search_contacts")}
        sticky
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
