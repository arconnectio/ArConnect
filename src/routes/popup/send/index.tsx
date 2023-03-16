import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { getAnsProfile, AnsUser, getAnsProfileByLabel } from "~lib/ans";
import { RawStoredTransfer, TRANSFER_TX_STORAGE } from "~utils/storage";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { formatAddress, isAddress } from "~utils/format";
import { useState, useEffect, useMemo } from "react";
import { IconButton } from "~components/IconButton";
import { useHistory } from "~utils/hash_router";
import { useBalance } from "~wallets/hooks";
import { getArPrice } from "~lib/coingecko";
import { Storage } from "@plasmohq/storage";
import { useTokens } from "~tokens";
import {
  Button,
  Input,
  Loading,
  Section,
  Spacer,
  Text,
  Tooltip,
  useInput,
  useToasts
} from "@arconnect/components";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon
} from "@iconicicons/react";
import AddressScanner from "~components/popup/AddressScanner";
import Token, { ArToken } from "~components/popup/Token";
import Collectible from "~components/popup/Collectible";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Send({ id }: Props) {
  // amount
  const startAmount = "1";
  const [amount, setAmount] = useState(startAmount);

  // balance
  const balance = useBalance();

  useEffect(() => {
    if (balance === 0) return;

    const amountInt = Number(amount);

    if (balance < amountInt) {
      const max = balance.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        useGrouping: false
      });

      setAmount(max);
      setDisplayedAmount(max);
    }
  }, [balance, amount]);

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
      if (!target?.address) return;

      const arweave = new Arweave(defaultGateway);
      const price = await arweave.transactions.getPrice(0, target.address);

      setFee(arweave.ar.winstonToAr(price));
    })();
  }, [target]);

  // get fiat value
  const [fiatVal, setFiatVal] = useState(0);

  useEffect(() => {
    (async () => {
      if (!currency) return;

      const price = await getArPrice(currency);
      setFiatVal(price * parseFloat(amount));
    })();
  }, [amount, currency]);

  // loading target
  const [loadingTarget, setLoadingTarget] = useState(false);

  // fetch target data
  useEffect(() => {
    (async () => {
      setLoadingTarget(false);

      let targetAddress = targetInput.state;
      let ansProfile: AnsUser;

      if (targetAddress === "" || !targetAddress) return;

      setLoadingTarget(true);

      if (targetAddress.includes(".ar")) {
        // fetch profile with label
        ansProfile = await getAnsProfileByLabel(
          targetAddress.replace(".ar", "")
        );
      } else if (isAddress(targetAddress)) {
        setTarget({ address: targetAddress });

        // fetch profile with address
        ansProfile = (await getAnsProfile(targetAddress)) as AnsUser;
      } else {
        setLoadingTarget(false);
        return;
      }

      if (!ansProfile) {
        setLoadingTarget(false);
        if (isAddress(targetAddress)) return;

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
      setLoadingTarget(false);
    })();
  }, [targetInput.state]);

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

  // toasts
  const { setToast } = useToasts();

  // router push
  const [push] = useHistory();

  // send tx
  async function send() {
    // return if target is undefined
    if (!target) {
      return;
    }

    // check amount
    const amountInt = Number(amount);

    if (Number.isNaN(amountInt) || amountInt <= 0) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_amount"),
        duration: 2000
      });
    }

    // check target
    if (!isAddress(target.address)) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalid_address"),
        duration: 2000
      });
    }

    try {
      // create tx
      let arweave = new Arweave(defaultGateway);
      let tx = await arweave.createTransaction({
        target: target.address,
        quantity: arweave.ar.arToWinston(amount.toString())
      });

      if (selectedToken !== "AR") {
        // get token gateway
        if (selectedTokenData.gateway) {
          arweave = new Arweave(selectedTokenData.gateway);
        }

        // create interaction
        tx = await arweave.createTransaction({
          target: target.address,
          quantity: "0",
          data: (Math.random() * Math.pow(10, 5)).toFixed(0)
        });

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

      // save tx json into the session
      // to be signed and submitted
      const storage = new Storage({
        area: "session",
        allSecret: true
      });
      const storedTx: RawStoredTransfer = {
        type: selectedToken === "AR" ? "native" : "token",
        gateway: selectedTokenData?.gateway || defaultGateway,
        transaction: tx.toJSON()
      };

      await storage.set(TRANSFER_TX_STORAGE, storedTx);

      // push to auth & signature
      push(`/send/auth`);
    } catch {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("transaction_send_error"),
        duration: 2000
      });
    }

    passwordInput.setState("");
    targetInput.setState("");
  }

  // editing target status
  const [editingTarget, setEditingTarget] = useState(false);

  // displayed amount
  const [displayedAmount, setDisplayedAmount] = useState(startAmount);

  // update amount using the keypad
  function keypadUpdate(val: string) {
    setAmount((v) => {
      if ((!v || v === "0") && val !== ".") {
        setDisplayedAmount(val);
        return val;
      }

      setDisplayedAmount(v + val);

      return v + val;
    });
  }

  // try to paste target from clipboard on focus
  async function pasteTarget() {
    try {
      // get clipboard permission
      const permission = await navigator.permissions.query({
        // @ts-expect-error
        name: "clipboard-read"
      });

      if (permission.state === "denied") return;

      // get clipboard items
      const clipboard = await navigator.clipboard.readText();

      // check if clipboard contains an address
      // or an ANS name
      if (!clipboard || (!isAddress(clipboard) && !clipboard.includes(".ar")))
        return;

      // set target input
      targetInput.setState(clipboard);
    } catch {}
  }

  // address scanner
  const [showAddressScanner, setShowAddressScanner] = useState(false);

  return (
    <Wrapper>
      <div>
        <Head title={browser.i18n.getMessage("send")} />
        <Spacer y={0.25} />
        <UpperSection>
          <AmountWrapper>
            <MaxAmount
              onClick={() => {
                const maxAmount = (balance - Number(fee)).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                    useGrouping: false
                  }
                );

                setAmount(maxAmount);
                setDisplayedAmount(maxAmount);
              }}
            >
              MAX
            </MaxAmount>
            <Amount
              onInput={(e) => {
                const val = Number(
                  e.currentTarget.innerText.replace(/[\n\r]/g, "")
                );

                if (Number.isNaN(val)) {
                  return setAmount("0");
                }

                return setAmount(val.toString());
              }}
              onKeyDown={async (e) => {
                // don't let the user type anything other than numbers
                if (
                  ![
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    ".",
                    "Backspace",
                    "ArrowLeft",
                    "ArrowRight"
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }

                // handle enter submit
                if (e.key !== "Enter") return;
                if (!target?.address || balance < Number(amount)) return;
                await send();
              }}
            >
              {displayedAmount}
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
          <TargetWrapper>
            <Target onClick={() => setEditingTarget((val) => !val)}>
              {loadingTarget && <TargetLoading />}
              {(target && (
                <>
                  {target.avatar && <TargetAvatar src={target.avatar} />}
                  <TargetName>
                    {target.label || formatAddress(target.address, 6)}
                  </TargetName>
                </>
              )) || (
                <TargetName>
                  {browser.i18n.getMessage("transaction_send_add_target")}
                </TargetName>
              )}
            </Target>
            <Tooltip
              content={browser.i18n.getMessage("transaction_send_scan_address")}
            >
              <ScanIcon onClick={() => setShowAddressScanner(true)} />
            </Tooltip>
          </TargetWrapper>
          <AnimatePresence>
            {editingTarget && (
              <motion.div
                variants={expandAnimation}
                initial="hidden"
                animate="shown"
                exit="hidden"
              >
                <Spacer y={1} />
                <InputWithBtn>
                  <InputWrapper>
                    <Input
                      type="text"
                      {...targetInput.bindings}
                      label={browser.i18n.getMessage("target")}
                      placeholder="ljvCPN31XCLPkBo9FUeB7vAK0VC6-eY52-CS-6Iho8U"
                      fullWidth
                      onFocus={pasteTarget}
                    />
                  </InputWrapper>
                  <IconButton secondary onClick={() => setEditingTarget(false)}>
                    <CheckIcon />
                  </IconButton>
                </InputWithBtn>
              </motion.div>
            )}
          </AnimatePresence>
        </UpperSection>
      </div>
      <AnimatePresence>
        {!editingTarget && (
          <motion.div
            variants={animation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <KeypadSection>
              <Keypad>
                {new Array(9).fill("").map((_, i) => (
                  <KeypadButton
                    key={i}
                    onClick={() => keypadUpdate((i + 1).toString())}
                  >
                    <span>{i + 1}</span>
                  </KeypadButton>
                ))}
                <KeypadButton onClick={() => keypadUpdate(".")}>
                  <span>.</span>
                </KeypadButton>
                <KeypadButton onClick={() => keypadUpdate("0")}>
                  <span>0</span>
                </KeypadButton>
                <KeypadButton
                  onClick={() =>
                    setAmount((val) => {
                      if (val.length <= 1) {
                        setDisplayedAmount("0");
                        return "0";
                      }

                      const newVal = val.substring(0, val.length - 1);
                      setDisplayedAmount(newVal);

                      return newVal;
                    })
                  }
                >
                  <ArrowLeftIcon />
                </KeypadButton>
              </Keypad>
              <SendButton
                disabled={!target?.address || balance < Number(amount)}
                onClick={send}
              >
                {browser.i18n.getMessage("send")}
                <ArrowUpRightIcon />
              </SendButton>
            </KeypadSection>
          </motion.div>
        )}
      </AnimatePresence>
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
      <AddressScanner
        onScan={(data) => {
          if (!data) return;
          if (!isAddress(data) && !data.includes(".ar")) {
            return;
          }

          targetInput.setState(data);
          setShowAddressScanner(false);
        }}
        active={showAddressScanner}
        close={() => setShowAddressScanner(false)}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  gap: 2.5rem;
`;

const UpperSection = styled(Section)`
  padding-top: 0;
  padding-bottom: 0;
`;

const AmountWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.45rem;
`;

const MaxAmount = styled(Text).attrs({
  noMargin: true
})`
  position: absolute;
  top: 50%;
  right: 10px;
  font-size: 0.83rem;
  font-weight: 600;
  color: rgb(${(props) => props.theme.primaryText});
  text-transform: uppercase;
  cursor: pointer;
  text-align: center;
  transform: translateY(-50%);
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.95) translateY(-50%);
  }
`;

const Amount = styled(Text).attrs({
  title: true,
  noMargin: true,
  contentEditable: true,
  suppressContentEditableWarning: true
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

const TargetWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
`;

const ScanIcon = styled(CameraIcon)`
  font-size: 1.2rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Target = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.05rem 0.5rem;
  border-radius: 18px;
  background-color: rgb(${(props) => props.theme.theme});
  color: #fff;
  width: max-content;
  cursor: pointer;
  transition: all 0.125s ease-in-out;

  &:active {
    transform: scale(0.97);
  }
`;

const TargetLoading = styled(Loading)`
  color: #fff;
  width: 0.9rem;
  height: 0.9rem;
`;

const TargetName = styled.span`
  padding: 0.4rem 0;
`;

const TargetAvatar = styled.img.attrs({
  draggable: false,
  alt: "avatar"
})`
  height: 1.5rem;
  width: 1.5rem;
  border-radius: 100%;
  object-fit: cover;
  user-select: none;
`;

const KeypadSection = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: rgb(${(props) => props.theme.theme});
  border-radius: 45px 45px 0 0;
  padding: 20px;
  padding-top: 10px;
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  justify-content: space-between;
`;

const KeypadButton = styled.div`
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 100%;
  cursor: pointer;
  justify-self: center;
  transition: all 0.125s ease-in-out;

  span,
  svg {
    position: absolute;
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;
    color: #fff;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  svg {
    width: 1em;
    height: 1em;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const SendButton = styled(Button).attrs({
  fullWidth: true
})`
  background-color: #fff;
  color: #000;
  box-shadow: 0 0 0 0 rgb(255, 255, 255);

  &:hover:not(:active):not(:disabled) {
    box-shadow: 0 0 0 ${(props) => (props.small ? ".19rem" : ".25rem")}
      rgb(255, 255, 255);
  }

  &:disabled {
    opacity: 0.87;
    cursor: not-allowed;
  }
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

const expandAnimation: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  shown: {
    opacity: 1,
    height: "auto"
  }
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
  gap: 1.2rem;
  padding-top: 0;
`;

interface Props {
  id?: string;
}
