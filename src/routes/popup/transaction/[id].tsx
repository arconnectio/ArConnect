import {
  concatGatewayURL,
  defaultGateway,
  gql,
  urlToGateway
} from "~applications/gateway";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import { AnimatePresence, Variants, motion } from "framer-motion";
import type { GQLNodeInterface } from "ar-gql/dist/faces";
import { useEffect, useMemo, useState } from "react";
import { ShareIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import { getArPrice } from "~lib/coingecko";
import CustomGatewayWarning from "~components/auth/CustomGatewayWarning";
import Skeleton from "~components/Skeleton";
import CodeArea from "~components/CodeArea";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import prettyBytes from "pretty-bytes";
import styled from "styled-components";
import Arweave from "arweave";
import dayjs from "dayjs";

export default function Transaction({ id, gw }: Props) {
  if (!id) return <></>;

  // fetch tx data
  const [transaction, setTransaction] = useState<GQLNodeInterface>();

  // arweave gateway
  const gateway = useMemo(() => {
    if (!gw) {
      return defaultGateway;
    }

    return urlToGateway(decodeURIComponent(gw));
  }, [gw]);

  // arweave client
  const arweave = useMemo(() => new Arweave(gateway), [gateway]);

  useEffect(() => {
    if (!id) return;

    let timeoutID: number | undefined;

    const fetchTx = async () => {
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
                type
              }
              quantity {
                ar
              }
              tags {
                name
                value
              }
              block {
                height
                timestamp
              }
            }
          }        
        `,
        { id },
        gateway
      );

      if (!data.transaction) {
        timeoutID = setTimeout(fetchTx, 5000);
      } else {
        timeoutID = undefined;
        setTransaction(data.transaction);
      }
    };

    fetchTx();

    return () => {
      if (timeoutID) clearTimeout(timeoutID);
    };
  }, [id, gateway]);

  // transaction confirmations
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    (async () => {
      const status = await arweave.transactions.getStatus(id);

      setConfirmations(status.confirmed?.number_of_confirmations || 0);
    })();
  }, [id, arweave]);

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

  // get content type
  const getContentType = () =>
    transaction?.data?.type ||
    transaction?.tags?.find((t) => t.name.toLowerCase() === "content-type")
      ?.value;

  // transaction data
  const [data, setData] = useState<string>("");

  const isBinary = useMemo(() => {
    const type = getContentType();

    if (!type) return false;

    return !type.startsWith("text/") && !type.startsWith("application/");
  }, [transaction]);

  const isImage = useMemo(() => {
    const type = getContentType();

    return type && type.startsWith("image/");
  }, [transaction]);

  useEffect(() => {
    (async () => {
      if (!transaction || !id || !arweave || isBinary) {
        return;
      }

      const type = getContentType();

      // return for null type
      if (!type) {
        return;
      }

      // load data
      let txData = await (
        await fetch(`${concatGatewayURL(gateway)}/${id}`)
      ).text();

      // format json
      if (type === "application/json") {
        txData = JSON.stringify(JSON.parse(txData), null, 2);
      }

      setData(txData);
    })();
  }, [id, transaction, gateway, isBinary]);

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("titles_transaction")} />
        {(transaction && (
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
            <AnimatePresence>
              {gw && <CustomGatewayWarning simple />}
            </AnimatePresence>
            <Section>
              <Properties>
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_id")}
                  </PropertyName>
                  <PropertyValue>{formatAddress(id, 6)}</PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_from")}
                  </PropertyName>
                  <PropertyValue>
                    {formatAddress(transaction.owner.address, 6)}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_to")}
                  </PropertyName>
                  <PropertyValue>
                    {(transaction.recipient &&
                      formatAddress(transaction.recipient, 6)) ||
                      "-"}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_fee")}
                  </PropertyName>
                  <PropertyValue>
                    {transaction.fee.ar}
                    {" AR"}
                  </PropertyValue>
                </TransactionProperty>
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_size")}
                  </PropertyName>
                  <PropertyValue>
                    {prettyBytes(Number(transaction.data.size))}
                  </PropertyValue>
                </TransactionProperty>
                {transaction.block && (
                  <>
                    <TransactionProperty>
                      <PropertyName>
                        {browser.i18n.getMessage("transaction_block_timestamp")}
                      </PropertyName>
                      <PropertyValue>
                        {dayjs(transaction.block.timestamp * 1000).format(
                          "MMM DD, YYYY"
                        )}
                      </PropertyValue>
                    </TransactionProperty>
                    <TransactionProperty>
                      <PropertyName>
                        {browser.i18n.getMessage("transaction_block_height")}
                      </PropertyName>
                      <PropertyValue>
                        {"#"}
                        {transaction.block.height}
                      </PropertyValue>
                    </TransactionProperty>
                  </>
                )}
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_confirmations")}
                  </PropertyName>
                  <PropertyValue>
                    {confirmations.toLocaleString()}
                  </PropertyValue>
                </TransactionProperty>
                <Spacer y={0.1} />
                <PropertyName>
                  {browser.i18n.getMessage("transaction_tags")}
                </PropertyName>
                <Spacer y={0.05} />
                {transaction.tags.map((tag, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>{tag.name}</PropertyName>
                    <TagValue>{tag.value}</TagValue>
                  </TransactionProperty>
                ))}
                {(data || isBinary) && (
                  <>
                    <Spacer y={0.1} />
                    <PropertyName>
                      {browser.i18n.getMessage("transaction_data")}
                      <a
                        href={`${concatGatewayURL(gateway)}/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ShareIcon />
                      </a>
                    </PropertyName>
                    {(!isImage && (
                      <CodeArea>
                        {(isBinary &&
                          browser.i18n.getMessage(
                            "transaction_data_binary_warning"
                          )) ||
                          data}
                      </CodeArea>
                    )) || (
                      <ImageDisplay
                        src={`${concatGatewayURL(gateway)}/${id}`}
                      />
                    )}
                  </>
                )}
              </Properties>
            </Section>
          </>
        )) || (
          <>
            <Section style={{ paddingBottom: 0 }}>
              <FiatAmount>
                <Skeleton width="3rem" />
              </FiatAmount>
              <AmountTitle>
                <Skeleton width="6rem" />
              </AmountTitle>
            </Section>
            <Section>
              <Properties>
                {new Array(7).fill("").map((_, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>
                      <Skeleton width="7.2rem" />
                    </PropertyName>
                    <PropertyValue>
                      <Skeleton width="7.2rem" />
                    </PropertyValue>
                  </TransactionProperty>
                ))}
                <Spacer y={0.1} />
                <PropertyName>
                  <Skeleton width="4.8rem" />
                </PropertyName>
                <Spacer y={0.05} />
                {new Array(3).fill("").map((_, i) => (
                  <TransactionProperty key={i}>
                    <PropertyName>
                      <Skeleton width="7.2rem" />
                    </PropertyName>
                    <PropertyValue>
                      <Skeleton width="7.2rem" />
                    </PropertyValue>
                  </TransactionProperty>
                ))}
              </Properties>
            </Section>
          </>
        )}
      </div>
      <AnimatePresence>
        {id && transaction && (
          <motion.div
            variants={opacityAnimation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <Section>
              <Button
                fullWidth
                onClick={() =>
                  browser.tabs.create({
                    url: `https://viewblock.io/arweave/tx/${id}`
                  })
                }
                disabled={confirmations <= 0}
              >
                {(confirmations > 0 && "Viewblock") ||
                  browser.i18n.getMessage("transaction_not_on_viewblock")}
                <ShareIcon />
              </Button>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

export const FiatAmount = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;

  ${Skeleton} {
    margin: 0 auto 0.3em;
  }
`;

export const AmountTitle = styled.h1`
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

  ${Skeleton} {
    margin: 0 auto;
  }
`;

export const Properties = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
`;

export const TransactionProperty = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BasePropertyText = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.95rem;

  a {
    display: flex;
    color: inherit;
    text-decoration: none;

    svg {
      font-size: 1em;
      width: 1em;
      height: 1em;
    }
  }
`;

export const PropertyName = styled(BasePropertyText)`
  color: rgb(${(props) => props.theme.primaryText});
`;

export const PropertyValue = styled(BasePropertyText)`
  text-align: right;
`;

export const TagValue = styled(PropertyValue)`
  max-width: 50%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ImageDisplay = styled.img.attrs({
  draggable: false,
  alt: "Transaction data"
})`
  width: 100%;
  user-select: none;
`;

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

interface Props {
  id: string;
  // encodeURIComponent transformed gateway url
  gw?: string;
}
