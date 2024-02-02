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
import { multiSort } from "~utils/multi_sort";
import { enrichContact } from "~contacts/hooks";
import { EventType, trackEvent } from "~utils/analytics";

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
    trackEvent(EventType.CONTACTS, {});
  }, []);

  useEffect(() => {
    async function fetchContacts() {
      const storedContacts = await ExtensionStorage.get("contacts");

      if (storedContacts) {
        const namedContacts = storedContacts.filter((contact) => contact.name);
        const addressOnlyContacts = storedContacts.filter(
          (contact) => !contact.name
        );

        namedContacts.sort((a, b) => {
          const nameComparison = a.name.localeCompare(b.name);
          if (nameComparison !== 0) {
            return nameComparison;
          }

          return multiSort([a, b])[0] === a ? -1 : 1;
        });

        const sortedAddressOnlyContacts = multiSort(addressOnlyContacts);

        const sortedContacts = [...namedContacts, ...sortedAddressOnlyContacts];

        const enrichedContacts = await Promise.all(
          sortedContacts.map(async (contact) => await enrichContact(contact))
        );

        setContacts(enrichedContacts);
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
