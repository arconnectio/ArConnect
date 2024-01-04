import { Spacer, useInput } from "@arconnect/components";
import React, { useState, useEffect, useMemo } from "react";
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
  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  // setStoredContacts([
  //   {
  //     name: "Michael Scott",
  //     address: "ZtcbvuxHMDc6noCfWW6GzfWGyuN7BysYalOsN0o6cIg",
  //     profileIcon:
  //       "https://t4.ftcdn.net/jpg/04/60/03/13/240_F_460031310_ObbCLA1tKrqjsHa7je6G6BSa7iAYBANP.jpg"
  //   },
  //   {
  //     name: "John Doe",
  //     address: "XsmRAPh9dKSxZKxfeRQC6O4ixxuA1xCJbSgjRN-XBZ0",
  //     profileIcon:
  //       "https://t4.ftcdn.net/jpg/04/60/03/13/240_F_460031310_ObbCLA1tKrqjsHa7je6G6BSa7iAYBANP.jpg"
  //   },
  //   {
  //     name: "Sally May",
  //     address: "XsmRAPh9dKSxZKxfeRQC6O4ixxuA1xCJbSgjRN-XBZ0",
  //     profileIcon:
  //       "https://t4.ftcdn.net/jpg/04/60/03/13/240_F_460031310_ObbCLA1tKrqjsHa7je6G6BSa7iAYBANP.jpg"
  //   },
  // ]);

  const [contacts, setContacts] = useState<SettingsContactData[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      const storedContacts = await ExtensionStorage.get("contacts");
      if (storedContacts) {
        storedContacts.sort((a, b) => a.name.localeCompare(b.name));
        setContacts(storedContacts);
      }
    }

    fetchContacts();
  }, []);

  function groupContactsByFirstLetter(contacts) {
    return contacts.reduce((groups, contact) => {
      const firstLetter = contact.name[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
      return groups;
    }, {});
  }

  const groupedContacts = useMemo(
    () => groupContactsByFirstLetter(contacts),
    [contacts]
  );

  // router
  const [, params] = useRoute<{ contact?: string }>("/contacts/:contact?");
  const [, setLocation] = useLocation();

  // active subsetting
  const activeContact = useMemo(
    () => (params?.contact ? decodeURIComponent(params.contact) : undefined),
    [params]
  );

  const searchInput = useInput();

  // search filter function
  function filterSearchResults(contact: SettingsContactData) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.address.toLowerCase().includes(query.toLowerCase())
    );
  }

  return (
    <Wrapper>
      <SearchWrapper>
        <SearchInput
          placeholder={browser.i18n.getMessage("search_contacts")}
          {...searchInput.bindings}
          sticky
        />
        <AddContactButton onClick={() => setLocation("/contacts/new")}>
          {browser.i18n.getMessage("add_contact")}
        </AddContactButton>
      </SearchWrapper>
      <Spacer y={1} />
      <SettingsList>
        {Object.entries(groupedContacts).map(([letter, contacts]) => (
          <React.Fragment key={letter}>
            <LetterHeader>{letter}</LetterHeader>
            {contacts.filter(filterSearchResults).map((contact) => (
              <ContactListItem
                key={contact.address}
                name={contact.name}
                address={contact.address}
                profileIcon={contact.profileIcon}
                active={activeContact === contact.address}
              />
            ))}
          </React.Fragment>
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

const LetterHeader = styled.div`
  font-size: 12px;
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