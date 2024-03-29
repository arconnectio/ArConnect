import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  decodeSignature,
  messageToUR,
  transactionToUR
} from "~wallets/hardware/keystone";
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
  Button,
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

export default function SignMessage() {
  // sign params
  const params = useAuthParams<{
    data: string;
  }>();

  // reconstructed transaction
  const [dataToSign, setDataToSign] = useState<Buffer>();

  useEffect(() => {
    (async () => {
      if (!params?.data) return;
      // reset tx
      setDataToSign(Buffer.from(params?.data, "base64"));
    })();
  }, [params]);

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signMessage", params?.authID);

  // authorize
  async function authorize(data?: any) {
    // reply to request
    await replyToAuthRequest("signMessage", params.authID, undefined, data);

    // close the window
    closeWindow();
  }

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
    if (wallet.type !== "hardware" || !dataToSign) return;

    // load the ur data
    const ur = await messageToUR(dataToSign, wallet.xfp);

    setTransactionUR(ur);
  }

  // loading
  const [loading, setLoading] = useState(false);

  // qr-tx scanner
  const scanner = useScanner(async (res) => {
    setLoading(true);

    try {
      // validation
      if (!dataToSign) {
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
        "signMessage",
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
        {(!page && dataToSign && (
          <Section>
            <Properties>
              <TransactionProperty>
                <PropertyName>Message</PropertyName>
                <PropertyValue>
                  {Buffer.from(dataToSign).toString("hex")}
                </PropertyValue>
              </TransactionProperty>
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
            <Button
              fullWidth
              disabled={!dataToSign || loading}
              loading={!dataToSign || loading}
              onClick={async () => {
                if (!dataToSign) return;
                if (wallet.type === "hardware") {
                  // load tx ur
                  if (!page) await loadTransactionUR();

                  // update page
                  setPage((val) => (!val ? "qr" : "scanner"));
                } else await authorize();
              }}
            >
              {browser.i18n.getMessage("sign_authorize")}
            </Button>
            <Spacer y={0.75} />
          </>
        )}
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}
