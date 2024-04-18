import {
  useInput,
  Text,
  ButtonV2,
  ListItem,
  InputV2
} from "@arconnect/components";
import { ChevronDownIcon, ChevronUpIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { useMemo, useState } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { useContacts } from "~contacts/hooks";
import { searchArNSName } from "~lib/arns";
import { useToasts } from "@arconnect/components";
import { formatAddress, isAddressFormat } from "~utils/format";
import { ExtensionStorage } from "~utils/storage";
import { getAnsProfileByLabel, isANS } from "~lib/ans";

export type Contact = {
  name: string;
  address: string;
  profileIcon: string;
  notes: string;
  ArNSAddress: string;
  avatarId: string;
};

export const generateProfileIcon = (name) => {
  if (name && name.length > 0) {
    return name[0].toUpperCase();
  }
  return "";
};

export type Contacts = Contact[];

interface RecipientProps {
  onClick?: ({
    address,
    contact
  }: {
    address: string;
    contact?: Contact;
  }) => void;
  onClose: () => void;
}

export default function Recipient({ onClick, onClose }: RecipientProps) {
  const targetInput = useInput();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [show, setShow] = useState<boolean>(true);
  const { lastRecipients, storedContacts } = useContacts(activeAddress);
  const { setToast } = useToasts();

  const possibleTargets = useMemo(() => {
    const query = targetInput.state;

    if (!query || query === "") {
      return lastRecipients;
    }

    if (isAddressFormat(query)) {
      return [targetInput.state];
    }

    return lastRecipients.filter((addr) =>
      addr.toLowerCase().includes(query.toLowerCase())
    );
  }, [lastRecipients, targetInput]);

  const submit = async () => {
    try {
      if (isAddressFormat(targetInput.state)) {
        onClick({ address: targetInput.state });
        onClose();
        return;
      } else {
        let search = targetInput.state;
        const ANS = isANS(search);
        if (ANS) {
          const result = await getAnsProfileByLabel(search.slice(0, -3));
          if (!result) {
            setToast({
              type: "error",
              content: browser.i18n.getMessage("incorrect_address"),
              duration: 2400
            });
          }
          onClick({ address: result.user });
          onClose();
          setToast({
            type: "success",
            content: browser.i18n.getMessage("ans_added", [search]),
            duration: 2400
          });
          return;
        }
        if (targetInput.state.startsWith("ar://"))
          search = targetInput.state.substring(5);
        const result = await searchArNSName(search);
        if (!result.success) {
          onClick({ address: result.record.owner });
          onClose();
          setToast({
            type: "success",
            content: browser.i18n.getMessage("arns_added", [search]),
            duration: 2400
          });
          return;
        }
      }
      setToast({
        type: "error",
        content: browser.i18n.getMessage("check_address"),
        duration: 2400
      });
    } catch {}
  };

  const filteredAndGroupedContacts = useMemo(() => {
    const query = targetInput.state ? targetInput.state.toLowerCase() : "";

    const filteredContacts = storedContacts.filter(
      (contact) =>
        contact?.name.toLowerCase().includes(query) ||
        contact.address.toLowerCase().includes(query)
    );

    return filteredContacts.reduce((groups, contact) => {
      let letter = contact.name
        ? contact?.name[0].toUpperCase()
        : contact.address[0].toUpperCase();

      if (!letter.match(/[A-Z]/)) {
        letter = "0-9";
      }

      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
      return groups;
    }, {} as Record<string, Contacts>);
  }, [storedContacts, targetInput.state]);

  return (
    <>
      <SearchBarWrapper>
        <InputV2
          small
          {...targetInput.bindings}
          type="text"
          placeholder={browser.i18n.getMessage(
            "transaction_send_address_input_placeholder"
          )}
          fullWidth
          autoFocus
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !isAddressFormat(targetInput.state))
              return;
          }}
        />
        <ButtonV2
          style={{ borderRadius: "10px", width: "30px", padding: 0 }}
          onClick={() => {
            submit();
          }}
        >
          {browser.i18n.getMessage("add")}
        </ButtonV2>
      </SearchBarWrapper>
      <AddressesList>
        <Recents onClick={() => setShow(!show)}>
          <SubText>{browser.i18n.getMessage("recents")}</SubText>
          {show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Recents>
        {show &&
          possibleTargets.map((recipient, i) => (
            <Address
              key={i}
              onClick={() => {
                onClick({ address: recipient });
                onClose();
              }}
            >
              {formatAddress(recipient, 10)}
            </Address>
          ))}
      </AddressesList>
      <ContactsSection>
        <SubText>{browser.i18n.getMessage("your_contacts")}</SubText>
        {Object.keys(filteredAndGroupedContacts).map((letter) => (
          <ContactList key={letter}>
            <ContactAddress style={{ color: "white" }}>{letter}</ContactAddress>

            {filteredAndGroupedContacts[letter].map((contact) => (
              <ListItem
                small
                title={contact?.name}
                description={formatAddress(contact.address)}
                img={
                  contact.profileIcon
                    ? contact.profileIcon
                    : generateProfileIcon(contact?.name || contact.address)
                }
                key={contact.address}
                onClick={() => {
                  onClick({ contact, address: contact.address });
                  onClose();
                }}
              />
            ))}
          </ContactList>
        ))}
      </ContactsSection>
    </>
  );
}

const SearchBarWrapper = styled.div`
  display: flex;
  gap: 4px;
`;

const SubText = styled.h3`
  font-weight: 500;
  font-size: 1.25rem;
  margin: 0;
`;

const ContactAddress = styled.div`
  font-size: 10px;
  color: #aeadcd;
`;

const Recents = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px 4px;
  border-radius: 10px;
  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, 0.12);
    cursor: pointer;
  }
`;

const ContactsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
  justify-content: space-between;
`;

const ContactItem = styled.div`
  display: flex;
  cursor: pointer;
  align-items: center;
  border-radius: 10px;
  padding: 4px 0;
  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, 0.12);
  }
`;

export const ProfilePicture = styled.img<{ size?: string }>`
  width: ${(props) => (props.size ? props.size : "34px")};
  height: ${(props) => (props.size ? props.size : "34px")};
  border-radius: 50%;
  margin-right: 10px;
`;

export const AutoContactPic = styled.div<{ size?: string }>`
  width: ${(props) => (props.size ? props.size : "34px")};
  height: ${(props) => (props.size ? props.size : "34px")};
  display: flex;
  background-color: #ab9aff26;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  margin-right: 10px;
`;

const Name = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
  justify-content: space-between;
`;

const AddressesList = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 0.2rem;
`;

const Address = styled(Text).attrs({
  noMargin: true
})`
  padding: 0.86rem 0.7rem;
  border-radius: 12px;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.17s ease;

  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, 0.12);
  }

  &:active {
    transform: scale(0.97);
  }
`;
