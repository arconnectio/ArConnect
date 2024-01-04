import { Spacer } from "@arconnect/components";
import { useState, useEffect } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { SettingsList } from "./list/BaseElement";
import browser from "webextension-polyfill";
import SearchInput from "./SearchInput";
import styled from "styled-components";

export default function Contacts() {
  const [contacts, setContacts] = useState<SettingsContactData[]>([]);

  return (
    <Wrapper>
      <SearchInput
        placeholder={browser.i18n.getMessage("search_contacts")}
        sticky
      />
      <Spacer y={1} />
      <SettingsList></SettingsList>
    </Wrapper>
  );
}

interface SettingsContactData {
  name: string;
  address: string;
  profileIcon: string;
}

const Wrapper = styled.div`
  position: relative;
`;
