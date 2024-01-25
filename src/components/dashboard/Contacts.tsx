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
import { formatAddress } from "~utils/format";

export default function Contacts() {
  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  const [contacts, setContacts] = useState<SettingsContactData[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      const storedContacts = await ExtensionStorage.get("contacts");

      if (storedContacts) {
        const namedContacts = storedContacts.filter((contact) => contact.name);
        const addressOnlyContacts = storedContacts.filter(
          (contact) => !contact.name
        );

        namedContacts.sort((a, b) => a.name.localeCompare(b.name));

        addressOnlyContacts.sort((a, b) => {
          const aFirstChar = a.address.charAt(0);
          const bFirstChar = b.address.charAt(0);

          const getOrder = (char) => {
            if (char.match(/[A-Z]/i)) {
              return 0; // Letters first
            } else if (char.match(/[0-9]/)) {
              return 1; // Numbers second
            } else {
              return 2; // Other chars last
            }
          };

          const orderA = getOrder(aFirstChar);
          const orderB = getOrder(bFirstChar);

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          if (!a.name && aFirstChar.match(/[0-9]/)) {
            return 1; // Contact with no name and starts with a number comes after
          }

          if (!b.name && bFirstChar.match(/[0-9]/)) {
            return -1; // Contact with no name and starts with a number comes before
          }

          return a.address.localeCompare(b.address);
        });

        console.log("address only:", addressOnlyContacts);

        const sortedContacts = [...namedContacts, ...addressOnlyContacts];

        console.log("all:", sortedContacts);

        setContacts(sortedContacts);
      }
    }

    fetchContacts();
  }, [storedContacts]);

  function groupContactsByFirstLetter(contacts) {
    return contacts.reduce((groups, contact) => {
      let firstLetter = contact.name
        ? contact.name[0].toUpperCase()
        : contact.address[0].toUpperCase();

      if (!firstLetter.match(/[A-Z]/)) {
        firstLetter = "0-9";
      }

      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);

      console.log("groups:", groups);
      return groups;
    }, {});
  }

  const groupedContacts = useMemo(
    () => groupContactsByFirstLetter(contacts),
    [contacts]
  );

  // router
  const [matches, params] = useRoute<{ contact?: string }>(
    "/contacts/:contact?"
  );
  const [, setLocation] = useLocation();

  // active subsetting
  const activeContact = useMemo(
    () => (params?.contact ? decodeURIComponent(params.contact) : undefined),
    [params]
  );

  // Update the URL when a contact is clicked
  const handleContactClick = (contactAddress: string) => {
    setLocation(`/contacts/${encodeURIComponent(contactAddress)}`);
  };

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

  const handleSendToContact = (contactAddress: string) => {
    // Logic for handling send button click
  };

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
        {Object.entries(groupedContacts).map(([letter, contacts]) => {
          const filteredContacts = contacts.filter(filterSearchResults);

          console.log("filtered contacts:", filteredContacts);

          if (filteredContacts.length === 0) {
            return null;
          }

          return (
            <React.Fragment key={letter}>
              <LetterHeader>{letter}</LetterHeader>
              {filteredContacts.map((contact) => (
                <React.Fragment key={contact.address}>
                  {/* Check if contact has name */}
                  {contact.name && (
                    <ContactListItem
                      name={contact.name}
                      address={formatAddress(contact.address, 8)}
                      profileIcon={contact.profileIcon}
                      active={activeContact === contact.address}
                      onClick={() => handleContactClick(contact.address)}
                      onSendClick={() => handleSendToContact(contact.address)}
                    />
                  )}
                  {/* Address only contacts */}
                  {!contact.name && (
                    <ContactListItem
                      name={formatAddress(contact.address, 4)}
                      address={formatAddress(contact.address, 8)}
                      profileIcon={contact.profileIcon}
                      active={activeContact === contact.address}
                      onClick={() => handleContactClick(contact.address)}
                      onSendClick={() => handleSendToContact(contact.address)}
                    />
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}
      </SettingsList>
    </Wrapper>
  );
}

interface SettingsContactData {
  name?: string;
  address: string;
  profileIcon: string;
  arNSAdress?: string;
  notes?: string;
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
