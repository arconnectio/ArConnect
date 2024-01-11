import { Input, useInput, Text, Spacer } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { gql } from "~gateways/api";
import { findGateway } from "~gateways/wayfinder";
import { formatAddress, isAddressFormat } from "~utils/format";
import { ExtensionStorage } from "~utils/storage";

interface RecipientProps {
  onClick?: (address: string) => void;
  onClose: () => void;
}

export default function Recipient({ onClick, onClose }: RecipientProps) {
  const targetInput = useInput();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [lastRecipients, setLastRecipients] = useState<string[]>([]);

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
      <Input
        {...targetInput.bindings}
        type="text"
        placeholder={browser.i18n.getMessage(
          "transaction_send_address_input_placeholder"
        )}
        fullWidth
        autoFocus
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !isAddressFormat(targetInput.state)) return;
        }}
      />
      <AddressesList>
        {possibleTargets.map((recipient, i) => (
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
    </>
  );
}

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
