import {
  Button,
  Input,
  Section,
  Spacer,
  Text,
  useInput
} from "@arconnect/components";
import { ArrowUpRightIcon, ChevronDownIcon } from "@iconicicons/react";
import { defaultGateway } from "~applications/gateway";
import { formatAddress } from "~utils/format";
import { useState, useEffect } from "react";
import { getArPrice } from "~lib/coingecko";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Send() {
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

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const price = await arweave.transactions.getPrice(0, targetInput.state);

      setFee(arweave.ar.winstonToAr(price));
    })();
  }, [amount, targetInput.state]);

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
  const [target, setTarget] = useState<{
    address: string;
    label?: string;
    avatar?: string;
  }>();

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
            <Ticker>
              AR
              <ChevronDownIcon />
            </Ticker>
          </AmountWrapper>
          <Spacer y={0.4} />
          <Prices>
            <span>
              {fiatVal.toLocaleString(undefined, {
                style: "currency",
                currency: currency.toLowerCase(),
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 2
              })}
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
        <Button fullWidth>
          {browser.i18n.getMessage("send")}
          <ArrowUpRightIcon />
        </Button>
      </Section>
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
    color: #000;
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
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
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
