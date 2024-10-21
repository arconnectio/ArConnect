import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { decodeSignature, transactionToUR } from "~wallets/hardware/keystone";
import { constructTransaction } from "~api/modules/sign/transaction_builder";
import { formatFiatBalance, formatTokenBalance } from "~tokens/currency";
import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import type { DecodedTag } from "~api/modules/sign/tags";
import type { Tag } from "arweave/web/lib/transaction";
import type { Chunk } from "~api/modules/sign/chunks";
import { useEffect, useMemo, useState } from "react";
import { useScanner } from "@arconnect/keystone-sdk";
import { useActiveWallet } from "~wallets/hooks";
import { formatAddress } from "~utils/format";
import { getArPrice } from "~lib/coingecko";
import type { UR } from "@ngraveio/bc-ur";
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
  ButtonV2,
  Section,
  Spacer,
  Text,
  useToasts
} from "@arconnect/components";
import AnimatedQRScanner from "~components/hardware/AnimatedQRScanner";
import AnimatedQRPlayer from "~components/hardware/AnimatedQRPlayer";
import type Transaction from "arweave/web/lib/transaction";
import Wrapper from "~components/auth/Wrapper";
import Progress from "~components/Progress";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import prettyBytes from "pretty-bytes";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import BigNumber from "bignumber.js";

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
      return BigNumber("0");
    }

    const arweave = new Arweave(defaultGateway);
    const ar = arweave.ar.winstonToAr(params.transaction.quantity);

    return BigNumber(ar);
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
  const fiatPrice = useMemo(
    () => quantity.multipliedBy(arPrice),
    [quantity.toString(), arPrice]
  );

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
    if (!transaction) return 0;

    return transaction?.sizeInBytes ?? transaction.data.length;
  }, [transaction]);

  // authorize
  async function authorize(data?: any) {
    // reply to request
    await replyToAuthRequest("sign", params.authID, undefined, data);

    // close the window
    closeWindow();
  }

  // tags
  const tags = useMemo<DecodedTag[]>(() => {
    if (!transaction) return [];

    // @ts-expect-error
    const tags = transaction.get("tags") as Tag[];

    return tags.map((tag) => ({
      name: tag.get("name", { decode: true, string: true }),
      value: tag.get("value", { decode: true, string: true })
    }));
  }, [transaction]);

  // Check if it's a printTx
  const isPrintTx = useMemo(() => {
    return (
      tags.some((tag) => tag.name === "print:title") &&
      tags.some((tag) => tag.name === "print:timestamp")
    );
  }, [tags]);

  const recipient = useMemo(() => {
    if (tags.length === 0) return transaction?.target || "";

    // Warp Token
    const isWarpTx =
      tags.some(
        (tag) => tag.name === "App-Name" && tag.value === "SmartWeaveAction"
      ) && tags.some((tag) => tag.name === "Contract");
    if (isWarpTx) {
      const inputTag = tags.find((tag) => tag.name === "Input");
      if (inputTag?.value) {
        try {
          const inputValue = JSON.parse(inputTag.value);
          if (inputValue?.function === "transfer" && inputValue?.target) {
            return inputValue.target;
          }
        } catch (error) {}
      }
    }

    // AO Token
    const isAOTransferTx =
      tags.some((tag) => tag.name === "Data-Protocol" && tag.value === "ao") &&
      tags.some((tag) => tag.name === "Action" && tag.value === "Transfer");
    if (isAOTransferTx) {
      const recipientTag = tags.find((tag) => tag.name === "Recipient");
      if (recipientTag?.value) return recipientTag.value;
    }

    return transaction?.target || "";
  }, [tags]);

  /**
   * Hardware wallet logic
   */

  // current wallet
  const wallet = useActiveWallet();

  // current page
  const [page, setPage] = useState<"qr" | "scanner">();

  // load tx UR
  const [transactionUR, setTransactionUR] = useState<UR>();

  async function loadTransactionUR() {
    if (wallet.type !== "hardware" || !transaction) return;

    // load the ur data
    const ur = await transactionToUR(transaction, wallet.xfp, wallet.publicKey);

    setTransactionUR(ur);
  }

  // loading
  const [loading, setLoading] = useState(false);

  // qr-tx scanner
  const scanner = useScanner(async (res) => {
    setLoading(true);

    try {
      // validation
      if (!transaction) {
        throw new Error("Transaction undefined");
      }

      if (wallet?.type !== "hardware") {
        throw new Error("Wallet switched while signing");
      }

      // decode signature
      const data = await decodeSignature(res);

      // reply
      await authorize(data);
    } catch (e) {
      // log error
      console.error(
        `[ArConnect] Error decoding signature from keystone\n${e?.message || e}`
      );

      // reply to request
      await replyToAuthRequest(
        "sign",
        params.authID,
        "Failed to decode signature from keystone"
      );

      // close the window
      closeWindow();
    }

    setLoading(false);
  });

  // toast
  const { setToast } = useToasts();

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
        {(!page && (
          <Section>
            {isPrintTx ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <PropertyName>
                  {browser.i18n.getMessage("transaction_fee")}
                </PropertyName>
              </div>
            ) : (
              <FiatAmount>{formatFiatBalance(fiatPrice, currency)}</FiatAmount>
            )}
            <AmountTitle>
              {isPrintTx
                ? size > 100000
                  ? formatTokenBalance(fee, 5)
                  : formatTokenBalance(0)
                : formatTokenBalance(quantity)}
              <span>AR</span>
            </AmountTitle>
            {isPrintTx && (
              <FiatAmount>{formatFiatBalance(fee, currency)}</FiatAmount>
            )}
            <Properties>
              <TransactionProperty>
                <PropertyName>
                  {browser.i18n.getMessage("transaction_from")}
                </PropertyName>
                <PropertyValue>
                  {formatAddress(params.address, 6)}
                </PropertyValue>
              </TransactionProperty>
              {transaction?.target && (
                <TransactionProperty>
                  <PropertyName>
                    {browser.i18n.getMessage("transaction_to")}
                  </PropertyName>
                  <PropertyValue>{formatAddress(recipient, 6)}</PropertyValue>
                </TransactionProperty>
              )}
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
        )) || (
          <Section>
            <Text noMargin>{browser.i18n.getMessage("sign_scan_qr")}</Text>
            <Spacer y={1.5} />
            {(page === "qr" && <AnimatedQRPlayer data={transactionUR} />) || (
              <>
                <AnimatedQRScanner
                  {...scanner.bindings}
                  onError={(error) =>
                    setToast({
                      type: "error",
                      duration: 2300,
                      content: browser.i18n.getMessage(`keystone_${error}`)
                    })
                  }
                />
                <Spacer y={1} />
                <Text>
                  {browser.i18n.getMessage(
                    "keystone_scan_progress",
                    `${scanner.progress.toFixed(0)}%`
                  )}
                </Text>
                <Progress percentage={scanner.progress} />
              </>
            )}
          </Section>
        )}
      </div>
      <Section>
        {page !== "scanner" && (
          <>
            <ButtonV2
              fullWidth
              disabled={!transaction || loading}
              loading={!transaction || loading}
              onClick={async () => {
                if (!transaction) return;
                if (wallet.type === "hardware") {
                  // load tx ur
                  if (!page) await loadTransactionUR();

                  // update page
                  setPage((val) => (!val ? "qr" : "scanner"));
                } else await authorize();
              }}
            >
              {!page
                ? browser.i18n.getMessage("sign_authorize")
                : browser.i18n.getMessage("keystone_scan")}
            </ButtonV2>
            <Spacer y={0.75} />
          </>
        )}
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

interface StrippedTx extends Transaction {
  data: undefined;
  tags: undefined;
}
