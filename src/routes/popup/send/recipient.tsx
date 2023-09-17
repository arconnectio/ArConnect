import {
  ExtensionStorage,
  TRANSFER_TX_STORAGE,
  type RawStoredTransfer,
  TempTransactionStorage
} from "~utils/storage";
import {
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import { formatAddress, isAddressFormat } from "~utils/format";
import { defaultGateway, gql } from "~applications/gateway";
import type Transaction from "arweave/web/lib/transaction";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";
import Arweave from "arweave";

export default function Recipient({ tokenID, qty }: Props) {
  // transaction target input
  const targetInput = useInput();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // last recipients
  const [lastRecipients, setLastRecipients] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

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
        defaultGateway
      );

      // filter addresses
      const recipients = data.transactions.edges
        .filter((tx) => tx.node.recipient !== "")
        .map((tx) => tx.node.recipient);

      setLastRecipients([...new Set(recipients)]);
    })();
  }, [activeAddress]);

  // possible targets filtered using the search query
  // or if the search query is a valid address, display
  // only that
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

  // router push
  const [push] = useHistory();

  // toasts
  const { setToast } = useToasts();

  // prepare tx
  async function send(target: string) {
    try {
      // create tx
      const arweave = new Arweave(defaultGateway);

      // save tx json into the session
      // to be signed and submitted
      const storedTx: Partial<RawStoredTransfer> = {
        type: tokenID === "AR" ? "native" : "token",
        gateway: defaultGateway
      };

      if (tokenID !== "AR") {
        // create interaction
        const tx = await arweave.createTransaction({
          target,
          quantity: "0"
        });

        tx.addTag("App-Name", "SmartWeaveAction");
        tx.addTag("App-Version", "0.3.0");
        tx.addTag("Contract", tokenID);
        tx.addTag(
          "Input",
          JSON.stringify({
            function: "transfer",
            target: target,
            qty
          })
        );
        addTransferTags(tx);

        storedTx.transaction = tx.toJSON();
      } else {
        const tx = await arweave.createTransaction({
          target,
          quantity: qty.toString()
        });

        addTransferTags(tx);

        storedTx.transaction = tx.toJSON();
      }

      await TempTransactionStorage.set(TRANSFER_TX_STORAGE, storedTx);

      // push to auth & signature
      push(`/send/auth`);
    } catch {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("transaction_send_error"),
        duration: 2000
      });
    }
  }

  async function addTransferTags(transaction: Transaction) {
    transaction.addTag("Type", "Transfer");
    transaction.addTag("Client", "ArConnect");
    transaction.addTag("Client-Version", browser.runtime.getManifest().version);
  }

  return (
    <>
      <Head title={browser.i18n.getMessage("transaction_send_add_target")} />
      <Spacer y={0.75} />
      <Section>
        <Input
          {...targetInput.bindings}
          type="text"
          label={browser.i18n.getMessage(
            "transaction_send_address_input_label"
          )}
          placeholder={browser.i18n.getMessage(
            "transaction_send_address_input_placeholder"
          )}
          fullWidth
          autoFocus
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !isAddressFormat(targetInput.state))
              return;
            send(targetInput.state);
          }}
        />
        <Spacer y={1} />
        <AddressesList>
          {possibleTargets.map((recipient, i) => (
            <Address onClick={() => send(recipient)} key={i}>
              {formatAddress(recipient, 10)}
            </Address>
          ))}
        </AddressesList>
      </Section>
    </>
  );
}

const AddressesList = styled.div`
  display: flex;
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

interface Props {
  tokenID: string;
  qty: number;
}
