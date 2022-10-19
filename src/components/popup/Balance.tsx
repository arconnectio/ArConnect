import Application, { AppInfo } from "~applications/application";
import Graph, { GraphText } from "~components/popup/Graph";
import { defaultGateway } from "~applications/gateway";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { Spacer } from "@arconnect/components";
import { getAppURL } from "~utils/format";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  SettingsIcon
} from "@iconicicons/react";
import type ArdbTransaction from "ardb/lib/models/transaction";
import useActiveTab from "~utils/useActiveTab";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";
import axios from "axios";
import ArDB from "ardb";

export default function Balance() {
  // grab address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // balance in AR
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const arweave = new Arweave(defaultGateway);

      // fetch balance
      const winstonBalance = await arweave.wallets.getBalance(activeAddress);

      setBalance(Number(arweave.ar.winstonToAr(winstonBalance)));
    })();
  }, [activeAddress]);

  // balance in local currency
  const [fiat, setFiat] = useState(0);
  const [currency] = useSetting<string>("currency");

  useEffect(() => {
    (async () => {
      if (!currency) return;

      // fetch price in currency
      const { data } = await axios.get<{
        arweave: { [key: string]: number };
      }>(
        `https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=${currency.toLowerCase()}`
      );

      // calculate fiat balance
      setFiat(data.arweave[currency.toLowerCase()] * balance);
    })();
  }, [balance, currency]);

  // balance display
  const [hideBalance, setHideBalance] = useStorage<boolean>(
    {
      key: "hide_balance",
      area: "local",
      isSecret: true
    },
    false
  );

  // active app
  const activeTab = useActiveTab();
  const activeApp = useMemo<Application | undefined>(() => {
    if (!activeTab?.url) {
      return undefined;
    }

    return new Application(getAppURL(activeTab.url));
  }, [activeTab]);

  // active app data
  const [activeAppData, setActiveAppData] = useState<AppInfo>();

  useEffect(() => {
    (async () => {
      if (!activeApp) return;

      const connected = await activeApp.isConnected();
      if (!connected) return;

      setActiveAppData(await activeApp.getAppData());
    })();
  }, [activeApp]);

  // balance history
  const [historicalBalance, setHistoricalBalance] = useStorage<number[]>(
    {
      key: "historical_balance",
      area: "local",
      isSecret: true
    },
    []
  );

  useEffect(() => {
    if (!activeAddress) return;

    balanceHistory(activeAddress)
      .then((res) => setHistoricalBalance(res))
      .catch();
  }, [activeAddress]);

  return (
    <Graph
      actionBar={
        <>
          <Spacer x={0.18} />
          <ActionButton />
          <ActionButton as={ArrowDownLeftIcon} />
          <ActionButton as={GlobeIcon} />
          <ActionButton
            as={SettingsIcon}
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL("tabs/dashboard.html")
              })
            }
          />
          <Spacer x={0.18} />
        </>
      }
      data={historicalBalance}
    >
      <BalanceHead>
        <div>
          <BalanceText title noMargin>
            {(!hideBalance &&
              balance.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })) ||
              "*".repeat(balance.toFixed(2).length)}
            <Ticker>AR</Ticker>
          </BalanceText>
          <FiatBalanceText noMargin>
            {(!hideBalance &&
              fiat.toLocaleString(undefined, {
                style: "currency",
                currency: currency.toLowerCase(),
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 2
              })) ||
              "*".repeat(fiat.toFixed(2).length) + " " + currency.toUpperCase()}
            <HideBalanceButton
              onClick={() => setHideBalance((val) => !val)}
              as={hideBalance ? EyeOffIcon : EyeIcon}
            />
          </FiatBalanceText>
        </div>
        {activeAppData && (
          <ActiveAppIcon>
            <img
              src={activeAppData.logo}
              alt={activeAppData.name || ""}
              draggable={false}
            />
          </ActiveAppIcon>
        )}
      </BalanceHead>
    </Graph>
  );
}

async function balanceHistory(address: string) {
  const arweave = new Arweave(defaultGateway);
  const gql = new ArDB(arweave);

  // find txs coming in and going out
  const inTxs = (await gql
    .search()
    .to(address)
    .limit(100)
    .find()) as ArdbTransaction[];
  const outTxs = (await gql
    .search()
    .from(address)
    .limit(100)
    .find()) as ArdbTransaction[];

  // sort txs
  const txs = inTxs
    .concat(outTxs)
    .filter((tx) => !!tx?.block?.timestamp)
    .sort((a, b) => b.block.timestamp - a.block.timestamp)
    .slice(0, 100);

  // get initial balance
  let balance = parseFloat(
    arweave.ar.winstonToAr(await arweave.wallets.getBalance(address))
  );

  const res = [balance];

  // go back in time by tx and calculate
  // historical balance
  for (const tx of txs) {
    balance += parseFloat(tx.fee.ar);

    if (tx.owner.address === address) {
      balance += parseFloat(tx.quantity.ar);
    } else {
      balance -= parseFloat(tx.quantity.ar);
    }

    res.push(balance);
  }

  return res;
}

const BalanceHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BalanceText = styled(GraphText)`
  font-size: 2.3rem;
  font-weight: 600;
`;

const Ticker = styled.span`
  margin-left: 0.33rem;
`;

const FiatBalanceText = styled(GraphText)`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 400;
`;

const HideBalanceButton = styled(EyeIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  color: #fff;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.86);
  }
`;

const ActiveAppIcon = styled(Squircle).attrs({
  outline: "#000"
})`
  color: rgb(${(props) => props.theme.theme});
  width: 3rem;
  height: 3rem;
  cursor: pointer;

  img {
    position: absolute;
    top: 50%;
    left: 50%;
    user-select: none;
    transform: translate(-50%, -50%);
    transition: all 0.23s ease-in-out;
  }

  &:hover img {
    opacity: 0.84;
  }
`;

const ActionButton = styled(ArrowUpRightIcon)`
  color: #fff;
  font-size: 1.9rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.87);
  }
`;
