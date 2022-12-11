import {
  Button,
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { ArrowUpRightIcon, ChevronDownIcon } from "@iconicicons/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { formatAddress, isAddress } from "~utils/format";
import { useState, useEffect, useMemo } from "react";
import { decryptWallet } from "~wallets/encryption";
import { getAnsProfile, AnsUser, getAnsProfileByLabel } from "~lib/ans";
import { getArPrice } from "~lib/coingecko";
import { getActiveWallet } from "~wallets";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import Token, { ArToken } from "~components/popup/Token";
import Collectible from "~components/popup/Collectible";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "@arconnect/arweave";

export default function Send({ id }: Props) {
  // amount
  const startAmount = 1;
  const [amount, setAmount] = useState(startAmount);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // target input
  const targetInput = useInput();

  // password inputs
  const passwordInput = useInput();

  // calculate fee
  const [fee, setFee] = useState("0");

  // target data
  const [target, setTarget] = useState<{
    address: string;
    label?: string;
    avatar?: string;
  }>();

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const price = await arweave.transactions.getPrice(0, target.address);

      setFee(arweave.ar.winstonToAr(price));
    })();
  }, [amount, target]);

  // get fiat value
  const [fiatVal, setFiatVal] = useState(0);

  useEffect(() => {
    (async () => {
      if (!currency) return;

      const price = await getArPrice(currency);
      setFiatVal(price * amount);
    })();
  }, [amount, currency]);

  // fetch target data
  useEffect(() => {
    (async () => {
      let targetAddress = targetInput.state;
      let ansProfile: AnsUser;

      // fetch profile with address
      if (isAddress(targetAddress)) {
        ansProfile = (await getAnsProfile(targetAddress)) as AnsUser;
      } else if (targetAddress.includes(".ar")) {
        // fetch profile with label
        ansProfile = await getAnsProfileByLabel(
          targetAddress.replace(".ar", "")
        );
      } else {
        return;
      }

      if (!ansProfile) {
        return setTarget(undefined);
      }

      const label = ansProfile.currentLabel + ".ar";
      const avatar =
        concatGatewayURL(defaultGateway) + "/" + (ansProfile?.avatar || "");

      setTarget({
        address: ansProfile.user,
        label,
        avatar: ansProfile.avatar ? avatar : undefined
      });
    })();
  }, [targetInput.state]);

  // toasts
  const { setToast } = useToasts();

  // router location
  const [, setLocation] = useLocation();

  // loading
  const [loading, setLoading] = useState(false);

  // send tx
  async function send() {
    let wallet: JWKInterface;

    // return if target is undefined
    if (!target) {
      return;
    }

    setLoading(true);

    // get wallet
    try {
      const activeWallet = await getActiveWallet();
      wallet = await decryptWallet(activeWallet.keyfile, passwordInput.state);
    } catch {
      setLoading(false);
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2000
      });
    }

    // check amount
    if (amount <= 0) {
      setLoading(false);
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_amount"),
        duration: 2000
      });
    }

    // check target
    if (!isAddress(target.address)) {
      setLoading(false);
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_address"),
        duration: 2000
      });
    }

    try {
      // create and send tx
      const arweave = new Arweave(defaultGateway);
      let tx = await arweave.createTransaction(
        {
          target: target.address,
          quantity: arweave.ar.arToWinston(amount.toString())
        },
        wallet
      );

      if (selectedToken !== "AR") {
        tx = await arweave.createTransaction(
          {
            target: target.address,
            quantity: "0",
            data: (Math.random() * Math.pow(10, 5)).toFixed(0)
          },
          wallet
        );

        tx.addTag("App-Name", "SmartWeaveAction");
        tx.addTag("App-Version", "0.3.0");
        tx.addTag("Contract", selectedToken);
        tx.addTag(
          "Input",
          JSON.stringify({
            function: "transfer",
            target: target.address,
            qty: amount
          })
        );
      }

      tx.addTag("Type", "Transfer");
      tx.addTag("Client", "ArConnect");
      tx.addTag("Client-Version", browser.runtime.getManifest().version);

      await arweave.transactions.sign(tx, wallet);

      if (selectedToken === "AR") {
        await arweave.transactions.post(tx);
      } else {
        const uploader = await arweave.transactions.getUploader(tx);

        while (!uploader.isComplete) {
          await uploader.uploadChunk();
        }
      }

      setToast({
        type: "success",
        content: browser.i18n.getMessage("sent_tx"),
        duration: 2000
      });
      setLocation(`/transaction/${tx.id}`);
    } catch {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("txFailed"),
        duration: 2000
      });
    }

    passwordInput.setState("");
    targetInput.setState("");
    setLoading(false);
  }

  // show token selector
  const [showTokenSelector, setShownTokenSelector] = useState(false);

  // all tokens
  const [tokens] = useTokens();

  // selected token
  const [selectedToken, setSelectedToken] = useState<"AR" | string>(id || "AR");

  const selectedTokenData = useMemo(() => {
    if (selectedToken === "AR" || !selectedToken || !tokens) {
      return undefined;
    }

    return tokens.find((t) => t.id === selectedToken);
  }, [selectedToken, tokens]);

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("send")} />
        <Spacer y={1} />
        <Section>
          <AmountWrapper>
            <Amount
              onInput={(e) => {
                const val = Number(e.currentTarget.innerText);

                if (Number.isNaN(val)) {
                  return setAmount(0);
                }

                return setAmount(val);
              }}
            >
              {startAmount}
            </Amount>
            <Ticker onClick={() => setShownTokenSelector(true)}>
              {(selectedToken === "AR" && "AR") ||
                selectedTokenData?.ticker ||
                "???"}
              <ChevronDownIcon />
            </Ticker>
          </AmountWrapper>
          <Spacer y={0.4} />
          <Prices>
            <span>
              {(selectedToken === "AR" &&
                fiatVal.toLocaleString(undefined, {
                  style: "currency",
                  currency: currency.toLowerCase(),
                  currencyDisplay: "narrowSymbol",
                  maximumFractionDigits: 2
                })) ||
                "??"}
            </span>
            {" - "}
            {fee}
            {" AR "}
            {browser.i18n.getMessage("network_fee")}
          </Prices>
          <Spacer y={0.9} />
          {target && (
            <Target>
              {target.avatar && <TargetAvatar src={target.avatar} />}
              {target.label || formatAddress(target.address, 6)}
            </Target>
          )}
          <Spacer y={1} />
          <Input
            type="text"
            {...targetInput.bindings}
            label={browser.i18n.getMessage("target")}
            placeholder="ljvCPN31XCLPkBo9FUeB7vAK0VC6-eY52-CS-6Iho8U"
            fullWidth
          />
          <Spacer y={1} />
          <Input
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_your_password")}
            fullWidth
          />
        </Section>
      </div>
      <Section>
        <Button fullWidth loading={loading} onClick={send}>
          {browser.i18n.getMessage("send")}
          <ArrowUpRightIcon />
        </Button>
      </Section>
      <AnimatePresence>
        {showTokenSelector && (
          <TokenSelector
            variants={animation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <TokensSection>
              <ArToken
                onClick={() => {
                  setSelectedToken("AR");
                  setShownTokenSelector(false);
                }}
              />
              {tokens
                .filter((token) => token.type === "asset")
                .map((token, i) => (
                  <Token
                    id={token.id}
                    onClick={() => {
                      setSelectedToken(token.id);
                      setShownTokenSelector(false);
                    }}
                    key={i}
                  />
                ))}
            </TokensSection>
            <CollectiblesList>
              {tokens
                .filter((token) => token.type === "collectible")
                .map((token, i) => (
                  <Collectible
                    id={token.id}
                    onClick={() => {
                      setSelectedToken(token.id);
                      setShownTokenSelector(false);
                    }}
                    key={i}
                  />
                ))}
            </CollectiblesList>
          </TokenSelector>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
`;

const AmountWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.45rem;
`;

const Amount = styled(Text).attrs({
  title: true,
  noMargin: true,
  contentEditable: true
})`
  font-size: 3.35rem;
  line-height: 1em;
  outline: none;
`;

const Ticker = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1.15rem;
  color: rgb(${(props) => props.theme.primaryText});
  font-weight: 600;
  text-transform: uppercase;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.7;
  }

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
    color: rgb(${(props) => props.theme.primaryText});
  }
`;

const Prices = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.82rem;
  text-align: center;

  span {
    color: rgb(${(props) => props.theme.primaryText});
  }
`;

const Target = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.45rem 0.8rem;
  border-radius: 18px;
  margin: 0 auto;
  background-color: rgb(${(props) => props.theme.theme});
  color: #fff;
  width: max-content;
`;

const TargetAvatar = styled.img.attrs({
  draggable: false,
  alt: "avatar"
})`
  height: 1.1rem;
  width: 1.1rem;
  border-radius: 100%;
  object-fit: cover;
  user-select: none;
`;

const TokenSelector = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow-y: auto;
  background-color: rgb(${(props) => props.theme.background});
  z-index: 1000;
`;

const animation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const TokensSection = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
  padding-top: 2rem;
  padding-bottom: 1.4rem;
`;

const CollectiblesList = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding-top: 0;
`;

interface Props {
  id?: string;
}
