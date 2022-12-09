import { Button, Section, Spacer, Text } from "@arconnect/components";
import type { GQLTransactionInterface } from "ardb/lib/faces/gql";
import { defaultGateway, gql } from "~applications/gateway";
import { ShareIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import { useEffect, useMemo, useState } from "react";
import { getArPrice } from "~lib/coingecko";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Transaction({ id }: Props) {
  if (!id) return <></>;

  // fetch tx data
  const [transaction, setTransaction] = useState<GQLTransactionInterface>();

  useEffect(() => {
    (async () => {
      if (!id) {
        return;
      }

      const { data } = await gql(
        `
          query($id: ID!) {
            transaction(id: $id) {
              owner {
                address
              }
              recipient
              fee {
                ar
              }
              data {
                size
              }
              quantity {
                ar
              }
              tags {
                name
                value
              }
            }
          }        
        `,
        { id }
      );

      setTransaction(data.transaction);
    })();
  }, [id]);

  // transaction confirmations
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const status = await arweave.transactions.getStatus(id);

      setConfirmations(status.confirmed?.number_of_confirmations || 0);
    })();
  }, [id]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // arweave price
  const [arPrice, setArPrice] = useState(0);

  useEffect(() => {
    getArPrice(currency)
      .then((res) => setArPrice(res))
      .catch();
  }, [currency]);

  // transaction price
  const fiatPrice = useMemo(() => {
    const transactionQty = Number(transaction?.quantity?.ar || "0");

    return transactionQty * arPrice;
  }, [transaction, arPrice]);

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("transaction")} />
        {transaction && (
          <>
            <Section style={{ paddingBottom: 0 }}>
              <FiatAmount>
                {fiatPrice.toLocaleString(undefined, {
                  style: "currency",
                  currency: currency.toLowerCase(),
                  currencyDisplay: "narrowSymbol",
                  maximumFractionDigits: 2
                })}
              </FiatAmount>
              <AmountTitle>
                {Number(transaction.quantity.ar).toLocaleString(undefined, {
                  maximumFractionDigits: 4
                })}
                <span>AR</span>
              </AmountTitle>
            </Section>
            <Section>
              <Properties>
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction")} ID
                  </PropertyName>
                  <PropertyValue>{formatAddress(id, 6)}</PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>From</PropertyName>
                  <PropertyValue>
                    {formatAddress(transaction.owner.address, 6)}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>To</PropertyName>
                  <PropertyValue>
                    {(transaction.recipient &&
                      formatAddress(transaction.recipient, 6)) ||
                      "-"}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>Fee</PropertyName>
                  <PropertyValue>
                    {transaction.fee.ar}
                    {" AR"}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>Size</PropertyName>
                  <PropertyValue>
                    {transaction.data.size}
                    {" B"}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>Confirmations</PropertyName>
                  <PropertyValue>
                    {confirmations.toLocaleString()}
                  </PropertyValue>
                </TransactionProperty>
                <Spacer y={0.1} />
                <PropertyName>Tags</PropertyName>
                <Spacer y={0.05} />
                {transaction.tags.map((tag, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>{tag.name}</PropertyName>
                    <TagValue>{tag.value}</TagValue>
                  </TransactionProperty>
                ))}
              </Properties>
            </Section>
            <Section>
              <Button
                fullWidth
                onClick={() =>
                  browser.tabs.create({
                    url: `https://viewblock.io/arweave/tx/${id}`
                  })
                }
              >
                Viewblock
                <ShareIcon />
              </Button>
            </Section>
          </>
        )}
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const FiatAmount = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;

const AmountTitle = styled.h1`
  font-size: 2.8rem;
  font-weight: 600;
  color: rgb(${(props) => props.theme.primaryText});
  text-align: center;
  margin: 0;
  line-height: 1.1em;

  span {
    text-transform: uppercase;
    font-size: 0.55em;
    margin-left: 0.34rem;
  }
`;

const Properties = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
`;

const TransactionProperty = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BasePropertyText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.95rem;
`;

const PropertyName = styled(BasePropertyText)`
  color: rgb(${(props) => props.theme.primaryText});
`;

const PropertyValue = styled(BasePropertyText)`
  text-align: right;
`;

const TagValue = styled(PropertyValue)`
  max-width: 50%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

interface Props {
  id: string;
}
