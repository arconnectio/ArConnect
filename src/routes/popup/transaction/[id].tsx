import { formatFiatBalance, formatTokenBalance } from "~tokens/currency";
import { AnimatePresence, type Variants, motion } from "framer-motion";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import type { GQLNodeInterface } from "ar-gql/dist/faces";
import { useEffect, useMemo, useState } from "react";
import { useGateway } from "~gateways/wayfinder";
import { useHistory } from "~utils/hash_router";
import { ShareIcon, ChevronDownIcon, ChevronUpIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import { getArPrice } from "~lib/coingecko";
import { concatGatewayURL, urlToGateway } from "~gateways/utils";
import { gql } from "~gateways/api";
import CustomGatewayWarning from "~components/auth/CustomGatewayWarning";
import Skeleton from "~components/Skeleton";
import CodeArea from "~components/CodeArea";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import prettyBytes from "pretty-bytes";
import styled from "styled-components";
import Arweave from "arweave";
import HeadV2 from "~components/popup/HeadV2";
import dayjs from "dayjs";
import { SendButton } from "../send";
import {
  AutoContactPic,
  generateProfileIcon,
  ProfilePicture
} from "~components/Recipient";
import { TempTransactionStorage } from "~utils/storage";
import { useContact } from "~contacts/hooks";
import { EventType, PageType, trackEvent, trackPage } from "~utils/analytics";

// pull contacts and check if to address is in contacts

// need to manually set/replace tokenAddress here for ao interactions
interface ao {
  isAo: boolean;
  tokenId?: string | null;
}

export default function Transaction({ id: rawId, gw, message }: Props) {
  // fixup id
  const id = useMemo(() => rawId.split("?")[0], [rawId]);

  if (!id) return <></>;

  // fetch tx data
  const [transaction, setTransaction] = useState<GQLNodeInterface>();
  // const [contact, setContact] = useState<any | undefined>(undefined);
  const contact = useContact(transaction?.recipient);

  const [ao, setAo] = useState<ao>({ isAo: false });

  const [showTags, setShowTags] = useState<boolean>(false);

  // arweave gateway
  const defaultGateway = useGateway({
    ensureStake: true,
    startBlock: 0,
    graphql: true
  });
  const gateway = useMemo(() => {
    if (!gw) {
      return defaultGateway;
    }

    return urlToGateway(decodeURIComponent(gw));
  }, [gw, defaultGateway]);

  // arweave client
  const arweave = useMemo(() => new Arweave(gateway), [gateway]);

  useEffect(() => {
    if (!id) return;

    let timeoutID: number | undefined;

    const fetchTx = async () => {
      const cachedTx = JSON.parse(localStorage.getItem("latest_tx") || "{}");

      // load cached tx
      if (cachedTx?.id === id) setTransaction(cachedTx);

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

        const sdkTag = data.transaction.tags.find((tag) => tag.name === "SDK");
        if (sdkTag && sdkTag.value === "aoconnect") {
          setAo({ isAo: true, tokenId: data.transaction.recipient });
          const aoRecipient = data.transaction.tags.find(
            (tag) => tag.name === "Recipient"
          );
          const aoQuantity = data.transaction.tags.find(
            (tag) => tag.name === "Quantity"
          );
          data.transaction.quantity = { ar: aoQuantity.value, winston: "" };
          data.transaction.recipient = aoRecipient.value;
        }

        setTransaction(data.transaction);
      }
    };

    fetchTx();
    trackPage(PageType.SEND_COMPLETE);

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

  // get custom back params
  const [backPath, setBackPath] = useState<string>();

  useEffect(() => {
    const search = window.location.href.split("?");
    const params = new URLSearchParams(search[search.length - 1]);
    const back = params.get("back");

    if (!back) return;

    setBackPath(back);
  }, []);

  // Clears out current transaction
  useEffect(() => {
    (async () => {
      await TempTransactionStorage.removeItem("send");
    })();
  }, []);

  // router push
  const [push, back] = useHistory();

  // interaction input
  const input = useMemo(() => {
    const value = transaction?.tags?.find((tag) => tag.name === "Input")?.value;

    if (!value) return undefined;

    return JSON.parse(value);
  }, [transaction]);

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={message ? "Message" : "Transaction Complete"}
          back={() => {
            push("/");
          }}
        />
        {(transaction && (
          <>
            {!message && (
              <>
                <Section style={{ paddingTop: 9, paddingBottom: 8 }}>
                  <AmountTitle>
                    {formatTokenBalance(Number(transaction.quantity.ar))}
                    {/* NEEDS TO BE DYNAMIC */}
                    {!ao.isAo && <span>AR</span>}
                  </AmountTitle>
                  <FiatAmount>
                    {ao.isAo ? "$-.--" : formatFiatBalance(fiatPrice, currency)}
                  </FiatAmount>
                </Section>
                <AnimatePresence>
                  {gw && <CustomGatewayWarning simple />}
                </AnimatePresence>
              </>
            )}
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
                    <div>
                      {!contact ? (
                        <>
                          {(transaction.recipient &&
                            formatAddress(transaction.recipient, 6)) ||
                            "-"}
                          <AddContact>
                            {browser.i18n.getMessage("user_not_in_contacts")}{" "}
                            <span
                              onClick={() => {
                                trackEvent(EventType.ADD_CONTACT, {
                                  fromSendFlow: true
                                });
                                browser.tabs.create({
                                  url: browser.runtime.getURL(
                                    `tabs/dashboard.html#/contacts/new?address=${transaction.recipient}`
                                  )
                                });
                              }}
                            >
                              {browser.i18n.getMessage("create_contact")}
                            </span>
                          </AddContact>
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {contact.profileIcon ? (
                            <ProfilePicture
                              src={contact.profileIcon}
                              size="19px"
                            />
                          ) : (
                            <AutoContactPic size="19px">
                              {generateProfileIcon(
                                contact?.name || contact.address
                              )}
                            </AutoContactPic>
                          )}
                          {contact?.name || formatAddress(contact.address, 6)}
                        </div>
                      )}
                    </div>
                  </PropertyValue>
                </TransactionProperty>
                {!message && (
                  <TransactionProperty>
                    <PropertyName>
                      {browser.i18n.getMessage("transaction_size")}
                    </PropertyName>
                    <PropertyValue>
                      {prettyBytes(Number(transaction.data.size))}
                    </PropertyValue>
                  </TransactionProperty>
                )}
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
                <PropertyName
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                  onClick={() => setShowTags(!showTags)}
                >
                  {browser.i18n.getMessage("transaction_tags")}
                  {showTags ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </PropertyName>
                {showTags &&
                  transaction.tags.map(
                    (tag, i) =>
                      tag.name !== "Input" && (
                        <TransactionProperty key={i}>
                          <PropertyName>{tag.name}</PropertyName>
                          <TagValue>{tag.value}</TagValue>
                        </TransactionProperty>
                      )
                  )}
                {input && (
                  <>
                    <Spacer y={0.1} />
                    <PropertyName>
                      {browser.i18n.getMessage("transaction_input")}
                    </PropertyName>
                    <CodeArea>{JSON.stringify(input, undefined, 2)}</CodeArea>
                  </>
                )}
                {(data || isBinary) && (
                  <>
                    <Spacer y={0.1} />
                    <PropertyName
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {!message
                        ? browser.i18n.getMessage("transaction_data")
                        : browser.i18n.getMessage("signature_message")}
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
              <SendButton
                fullWidth
                onClick={() => {
                  const url = ao.isAo
                    ? `https://ao_marton.g8way.io/#/process/${ao.tokenId}/${id}`
                    : `https://viewblock.io/arweave/tx/${id}`;

                  browser.tabs.create({ url });
                }}
              >
                {ao.isAo ? "ao Scanner" : "Viewblock"}
                <ShareIcon />
              </SendButton>
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
  font-size: 12px;
  font-weight: 600;

  ${Skeleton} {
    margin: 0 auto 0.3em;
  }
`;

const AddContact = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: rgb(${(props) => props.theme.primaryText});
  margin: 0;

  span {
    cursor: pointer;
    color: #ab9aff;
    padding: 0;
  }
`;

export const AmountTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: rgb(${(props) => props.theme.primaryText});
  text-align: center;
  margin: 0;
  line-height: 1.1em;

  span {
    text-transform: uppercase;
    font-size: 1.25rem;
    margin-left: 0.34rem;
  }

  ${Skeleton} {
    margin: 0 auto;
  }
`;

export const Properties = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const TransactionProperty = styled.div`
  display: flex;
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
  display: flex;
  align-items: start;
  font-size: 14px;
  font-weight: 500;

  color: rgb(${(props) => props.theme.primaryText});
`;

export const PropertyValue = styled(BasePropertyText)`
  font-size: 14px;
  font-weight: 500;
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
  message?: boolean;
}
