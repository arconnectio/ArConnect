import { useInput, Text, Button, Input } from "@arconnect/components";
import { ChevronDownIcon, ChevronUpIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { gql } from "~gateways/api";
import { findGateway } from "~gateways/wayfinder";
import { formatAddress, isAddressFormat } from "~utils/format";
import { ExtensionStorage } from "~utils/storage";

type Contact = {
  name: string;
  arweave_address: string;
  image: string;
};

interface RecipientProps {
  onClick?: (address: string) => void;
  onClose: () => void;
}

const contacts = [
  {
    name: "gJDZnvNd",
    arweave_address: "ar_jcvquy4y6fsx8nav2mof455p59le3uyiwidgvl0c",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "kjJfrWMB",
    arweave_address: "ar_awk6b4rykczsiptpyj6792lfogini7z2i994ok2l",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "uBwkSSGf",
    arweave_address: "ar_y623m37qishjx9cxlm2al0b7bjhhacxz1zcbbbop",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "gfBQhXCL",
    arweave_address: "ar_o7gl9i98ocatne87wvj5uzd7uapmitzss59mfyg8",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Taylor Garcia",
    arweave_address: "ar_56dqbq0jh055ztct1mlxukgxb9glftvk6jzjjzsk",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Jordan Miller",
    arweave_address: "ar_clqap0kn4nyf5jx0xmaeyt7y6tf8mf6jg2gak1n2",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "ZnTlfMdD",
    arweave_address: "ar_89wfyhephr67ln8fr78zfyzh8b6asomz7sl6wlrq",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Alex Smith",
    arweave_address: "ar_7ieeqhvypn82a9b1m75wbbfx1730brq5ewcahxpe",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Casey Williams",
    arweave_address: "ar_eej20i50nv4j1u8qagvq68nhz0xn7dnmdun790r6",
    image: "https://via.placeholder.com/150"
  },
  {
    name: "ZYShphhQ",
    arweave_address: "ar_hcgynub54wx7ny844vtdfhppc0crr0q1ha87g3sl",
    image: "https://via.placeholder.com/150"
  }
];

export default function Recipient({ onClick, onClose }: RecipientProps) {
  //PLACEHOLDER
  const sortedContacts = contacts.sort((a, b) => a.name.localeCompare(b.name));

  const groupedContacts = sortedContacts.reduce((groups, contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(contact);
    return groups;
  }, {} as Record<string, Contact[]>);

  const targetInput = useInput();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [lastRecipients, setLastRecipients] = useState<string[]>([]);
  const [show, setShow] = useState<boolean>(true);
  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const gateway = await findGateway({ graphql: true });

      // fetch last outgoing txs
      const { data } = await gql(
        `
          query($address: [String!]) {
            transactions(owners: $address, first: 100) {
              edges {
                node {
                  recipient
                }
              }
            }
          }
        `,
        { address: activeAddress },
        gateway
      );

      // filter addresses
      const recipients = data.transactions.edges
        .filter((tx) => tx.node.recipient !== "")
        .map((tx) => tx.node.recipient);

      setLastRecipients([...new Set(recipients)]);
    })();
  }, [activeAddress]);

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

  return (
    <>
      <div style={{ display: "flex", gap: "4px" }}>
        <Input
          small
          alternative={true}
          {...targetInput.bindings}
          type="text"
          placeholder={browser.i18n.getMessage(
            "transaction_send_address_input_placeholder"
          )}
          fullWidth
          autoFocus
          onKeyDown={(e) => {
            // setShow(true);
            if (e.key !== "Enter" || !isAddressFormat(targetInput.state))
              return;
          }}
        />
        <Button
          small
          style={{ borderRadius: "10px", width: "56px", padding: 0 }}
        >
          Add
        </Button>
      </div>
      <AddressesList>
        <Recents onClick={() => setShow(!show)}>
          <SubText>Recents</SubText>
          {show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Recents>
        {show &&
          possibleTargets.map((recipient, i) => (
            <Address
              key={i}
              onClick={() => {
                onClick(recipient);
                onClose();
              }}
            >
              {formatAddress(recipient, 10)}
            </Address>
          ))}
      </AddressesList>
      <ContactsSection>
        <SubText>Your Contacts</SubText>
        {/* {Object.keys(groupedContacts).map((letter) => (
          <ContactList key={letter}>
            <ContactAddress style={{ color: "white" }}>{letter}</ContactAddress>

            {groupedContacts[letter].map((contact) => (
              <ContactItem key={contact.arweave_address}>
                <ProfilePicture src={contact.image} alt="Profile" />
                <div>
                  <Name>{contact.name}</Name>
                  <ContactAddress>
                    {formatAddress(contact.arweave_address)}
                  </ContactAddress>
                </div>
              </ContactItem>
            ))}
          </ContactList>
        ))} */}
      </ContactsSection>
    </>
  );
}

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

const ProfilePicture = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 50%;
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
