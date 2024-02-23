import { useState, useEffect } from "react";
import type { Contact, Contacts } from "~components/Recipient";
import { gql } from "~gateways/api";
import { findGateway } from "~gateways/wayfinder";
import { getUserAvatar } from "~lib/avatar";
import { multiSort } from "~utils/multi_sort";
import { ExtensionStorage } from "~utils/storage";
import { arSvgie } from "@7i7o/arsvgies";

export const useContacts = (activeAddress: string) => {
  const [storedContacts, setContacts] = useState<Contacts>([]);
  const [lastRecipients, setLastRecipients] = useState<string[]>([]);

  useEffect(() => {
    const getContacts = async () => {
      try {
        const storedContacts: Contacts = await ExtensionStorage.get("contacts");

        if (storedContacts) {
          const namedContacts = storedContacts.filter(
            (contact) => contact.name
          );
          const addressOnlyContacts = storedContacts.filter(
            (contact) => !contact.name
          );

          namedContacts.sort((a, b) => a.name.localeCompare(b.name));

          const sortedAddressOnlyContacts = multiSort(addressOnlyContacts);

          const sortedContacts = [
            ...namedContacts,
            ...sortedAddressOnlyContacts
          ];

          const contactsWithImages = await Promise.all(
            sortedContacts.map(enrichContact)
          );
          setContacts(contactsWithImages);
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };

    const getRecentAddresses = async () => {
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
    };
    getContacts();
    getRecentAddresses();
  }, [activeAddress]);

  return { lastRecipients, storedContacts };
};

export const useContact = (contactAddress?: string): Contact => {
  const [contact, setContact] = useState<Contact | null>(null);
  useEffect(() => {
    const fetchContact = async () => {
      if (!contactAddress) {
        setContact(null);
        return;
      }
      // Fetch stored contacts
      const storedContacts: Contacts = await ExtensionStorage.get("contacts");

      let foundContact = storedContacts?.find(
        (c) => c.address === contactAddress
      );
      if (foundContact) {
        foundContact = await enrichContact(foundContact);
      }
      setContact(foundContact || null);
    };

    if (contactAddress) {
      fetchContact();
    }
  }, [contactAddress]);
  return contact;
};

export const enrichContact = async (contact: Contact) => {
  let updatedContact = { ...contact };

  if (contact.avatarId) {
    try {
      const profileImage = await getUserAvatar(contact.avatarId);
      updatedContact = {
        ...updatedContact,
        profileIcon: profileImage
      };
    } catch (error) {
      console.error(
        `Failed to fetch profile image for avatarId ${contact.avatarId}:`,
        error
      );
    }
  } else {
    if (contact.avatar) {
      updatedContact = {
        ...updatedContact,
        profileIcon: contact.avatar
      };
    }
  }

  return updatedContact;
};

export const useSvgie = (address?: string): string => {
  const [svgie, setSvgie] = useState("");
  const addressRegex = /^[a-z0-9-_]{43}$/i;
  useEffect(() => {
    const fetchSvgie = async () => {
      const svgieAvatar = await arSvgie(address, { asDataURI: true });
      setSvgie(svgieAvatar);
    };

    if (address && address.length === 43 && addressRegex.test(address)) {
      fetchSvgie();
    }
  }, [address]);
  return svgie;
};

export const getSvgies = async (
  wallets?: { address: string }[]
): Promise<{ address: string; avatar: string }[]> => {
  const svgies = [];
  for (const wallet of wallets) {
    svgies.push({
      address: wallet.address,
      avatar: await arSvgie(wallet.address, { asDataURI: true })
    });
  }
  return svgies;
};
