import { Spacer } from "@arconnect/components";
import { useState, useEffect, useMemo } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { SettingsList } from "./list/BaseElement";
import ContactListItem from "./list/ContactListItem";
import { useLocation, useRoute } from "wouter";
import browser from "webextension-polyfill";
import SearchInput from "./SearchInput";
import styled from "styled-components";
import { IconButton } from "~components/IconButton";

export default function Contacts() {
  const [contacts, setContacts] = useState<SettingsContactData[]>([]);

  useEffect(() => {
    setContacts([
      {
        name: "Michael Scott",
        address: "ZtcbvuxHMDc6noCfWW6GzfWGyuN7BysYalOsN0o6cIg",
        profileIcon:
          "https://t4.ftcdn.net/jpg/04/60/03/13/240_F_460031310_ObbCLA1tKrqjsHa7je6G6BSa7iAYBANP.jpg"
      },
      {
        name: "John Doe",
        address: "XsmRAPh9dKSxZKxfeRQC6O4ixxuA1xCJbSgjRN-XBZ0",
        profileIcon:
          "https://t4.ftcdn.net/jpg/04/60/03/13/240_F_460031310_ObbCLA1tKrqjsHa7je6G6BSa7iAYBANP.jpg"
      }
    ]);
  }, []);

  // router
  const [, params] = useRoute<{ contact?: string }>("/contacts/:contact?");
  const [, setLocation] = useLocation();

  // active subsetting
  const activeContact = useMemo(
    () => (params?.contact ? decodeURIComponent(params.contact) : undefined),
    [params]
  );

  return (
    <Wrapper>
      <SearchWrapper>
        <SearchInput
          placeholder={browser.i18n.getMessage("search_contacts")}
          sticky
        />
        <AddContactButton onClick={() => setLocation("/contacts/new")}>
          {browser.i18n.getMessage("add_contact")}
        </AddContactButton>
      </SearchWrapper>
      <Spacer y={1} />
      <SettingsList>
        {contacts.map((contact) => (
          <ContactListItem
            name={contact.name}
            address={contact.address}
            profileIcon={contact.profileIcon}
            active={activeContact === contact.address}
          />
        ))}
      </SettingsList>
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

const SearchWrapper = styled.div`
  position: sticky;
  display: grid;
  gap: 5px;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  grid-template-columns: auto auto;
`;

const AddContactButton = styled(IconButton).attrs({
  secondary: true
})`
  background: linear-gradient(
      0deg,
      rgba(${(props) => props.theme.theme}, 0.2),
      rgba(${(props) => props.theme.theme}, 0.2)
    ),
    rgb(${(props) => props.theme.background});
`;
