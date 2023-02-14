import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import { defaultGateway } from "~applications/gateway";
import type { Chunk } from "~api/modules/sign/chunks";
import { useEffect, useMemo, useState } from "react";
import { formatAddress } from "~utils/format";
import { getArPrice } from "~lib/coingecko";
import {
  AmountTitle,
  FiatAmount,
  Properties,
  PropertyName,
  PropertyValue,
  TagValue,
  TransactionProperty
} from "~routes/popup/transaction/[id]";
import {
  Button,
  Section,
  Spacer,
  useInput,
  useToasts
} from "@arconnect/components";
import type Transaction from "arweave/web/lib/transaction";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import prettyBytes from "pretty-bytes";
import Arweave from "arweave";
import { constructTransaction } from "~api/modules/sign/transaction_builder";
import type { Tag } from "arweave/web/lib/transaction";

export default function Sign() {
  // sign params
  const params = useAuthParams<{
    url: string;
    address: string;
    transaction: StrippedTx;
    collectionID: string;
  }>();

  // reconstructed transaction
  const [transaction, setTransaction] = useState<Transaction>();

  useEffect(() => {
    (async () => {
      if (!params?.transaction) return;

      // reset tx
      setTransaction(undefined);

      // request chunks
      sendMessage("auth_listening", null, "background");

      const chunks: Chunk[] = [];
      const arweave = new Arweave(defaultGateway);

      // listen for chunks
      onMessage("auth_chunk", ({ sender, data }) => {
        // check data type
        if (
          data.collectionID !== params.collectionID ||
          sender.context !== "background" ||
          data.type === "start"
        ) {
          return;
        }

        // end chunk stream
        if (data.type === "end") {
          setTransaction(
            arweave.transactions.fromRaw(
              constructTransaction(params.transaction, chunks)
            )
          );
        } else {
          // add chunk
          chunks.push(data);
        }
      });
    })();
  }, [params]);

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("sign", params?.authID);

  // quantity
  const quantity = useMemo(() => {
    if (!params?.transaction?.quantity) {
      return 0;
    }

    const arweave = new Arweave(defaultGateway);
    const ar = arweave.ar.winstonToAr(params.transaction.quantity);

    return Number(ar);
  }, [params]);

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
  const fiatPrice = useMemo(() => quantity * arPrice, [quantity, arPrice]);

  // transaction fee
  const fee = useMemo(() => {
    if (!params?.transaction?.reward) {
      return "0";
    }

    const arweave = new Arweave(defaultGateway);

    return arweave.ar.winstonToAr(params.transaction.reward);
  }, [params]);

  // transaction size
  const size = useMemo(() => {
    if (!params?.transaction?.size) {
      return 0;
    }

    return Number(params.transaction.size);
  }, [params]);

  // authorize
  async function authorize() {
    // reply to request
    await replyToAuthRequest("sign", params.authID);

    // close the window
    closeWindow();
  }

  // tags
  const tags = useMemo<
    {
      name: string;
      value: string;
    }[]
  >(() => {
    if (!transaction) return [];

    // @ts-expect-error
    const tags = transaction.get("tags") as Tag[];

    return tags.map((tag) => ({
      name: tag.get("name", { decode: true, string: true }),
      value: tag.get("value", { decode: true, string: true })
    }));
  }, [transaction]);

  if (!params) return <></>;

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("titles_sign")}
          showOptions={false}
          back={cancel}
          allowOpen={false}
        />
        <Spacer y={0.75} />
        <Section>
          <FiatAmount>
            {fiatPrice.toLocaleString(undefined, {
              style: "currency",
              currency: currency.toLowerCase(),
              currencyDisplay: "narrowSymbol",
              maximumFractionDigits: 2
            })}
          </FiatAmount>
          <AmountTitle>
            {quantity.toLocaleString(undefined, {
              maximumFractionDigits: 4
            })}
            <span>AR</span>
          </AmountTitle>
          <Properties>
            <TransactionProperty>
              <PropertyName>
                {browser.i18n.getMessage("transaction_from")}
              </PropertyName>
              <PropertyValue>{formatAddress(params.address, 6)}</PropertyValue>
            </TransactionProperty>
            <TransactionProperty>
              <PropertyName>
                {browser.i18n.getMessage("transaction_fee")}
              </PropertyName>
              <PropertyValue>
                {fee}
                {" AR"}
              </PropertyValue>
            </TransactionProperty>
            <TransactionProperty>
              <PropertyName>
                {browser.i18n.getMessage("transaction_size")}
              </PropertyName>
              <PropertyValue>{prettyBytes(size)}</PropertyValue>
            </TransactionProperty>
            <Spacer y={0.1} />
            <PropertyName>
              {browser.i18n.getMessage("transaction_tags")}
            </PropertyName>
            <Spacer y={0.05} />
            {tags.map((tag, i) => (
              <TransactionProperty key={i}>
                <PropertyName>{tag.name}</PropertyName>
                <TagValue>{tag.value}</TagValue>
              </TransactionProperty>
            ))}
          </Properties>
        </Section>
      </div>
      <Section>
        <Button fullWidth onClick={authorize}>
          {browser.i18n.getMessage("sign_authorize")}
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}

interface StrippedTx extends Transaction {
  data: undefined;
  tags: undefined;
}
