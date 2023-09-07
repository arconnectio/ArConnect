import { formatTokenBalance, formatFiatBalance } from "~tokens/currency";
import Application, { type AppInfo } from "~applications/application";
import { defaultGateway, gql } from "~applications/gateway";
import Graph, { GraphText } from "~components/popup/Graph";
import { Spacer, Tooltip } from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useHistory } from "~utils/hash_router";
import { useBalance } from "~wallets/hooks";
import { getArPrice } from "~lib/coingecko";
import { getAppURL } from "~utils/format";
import { useTheme } from "~utils/theme";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  SettingsIcon,
  LockIcon
} from "@iconicicons/react";
import useActiveTab from "~applications/useActiveTab";
import AppIcon, { NoAppIcon } from "./AppIcon";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";
import { removeDecryptionKey } from "~wallets/auth";

export default function Balance() {
  // grab address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // balance in AR
  const balance = useBalance();

  // balance in local currency
  const [fiat, setFiat] = useState(0);
  const [currency] = useSetting<string>("currency");

  useEffect(() => {
    (async () => {
      if (!currency) return;

      // fetch price in currency
      const arPrice = await getArPrice(currency);

      // calculate fiat balance
      setFiat(arPrice * balance);
    })();
  }, [balance, currency]);

  // balance display
  const [hideBalance, setHideBalance] = useStorage<boolean>(
    {
      key: "hide_balance",
      instance: ExtensionStorage
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
      if (!connected) {
        return setActiveAppData(undefined);
      }

      setActiveAppData(await activeApp.getAppData());
    })();
  }, [activeApp]);

  // balance history
  const [historicalBalance, setHistoricalBalance] = useStorage<number[]>(
    {
      key: "historical_balance",
      instance: ExtensionStorage
    },
    []
  );

  useEffect(() => {
    if (!activeAddress) return;

    balanceHistory(activeAddress, defaultGateway)
      .then((res) => setHistoricalBalance(res))
      .catch();
  }, [activeAddress]);

  // router push
  const [push] = useHistory();

  // display theme
  const theme = useTheme();

  // lock wallet and terminate session
  async function lockWallet() {
    await removeDecryptionKey();
    push("/unlock");
  }

  return (
    <Graph
      actionBar={
        <>
          <Spacer x={0.18} />
          <Tooltip content={browser.i18n.getMessage("send")}>
            <ActionButton onClick={() => push("/send/transfer")} />
          </Tooltip>
          <Tooltip content={browser.i18n.getMessage("receive")}>
            <ActionButton
              as={ArrowDownLeftIcon}
              onClick={() => push("/receive")}
            />
          </Tooltip>
          <Tooltip content={browser.i18n.getMessage("explore")}>
            <ActionButton as={GlobeIcon} onClick={() => push("/explore")} />
          </Tooltip>
          <Tooltip content={browser.i18n.getMessage("settings")}>
            <ActionButton
              as={SettingsIcon}
              onClick={() =>
                browser.tabs.create({
                  url: browser.runtime.getURL("tabs/dashboard.html")
                })
              }
            />
          </Tooltip>
          <Spacer x={0.18} />
        </>
      }
      data={historicalBalance}
    >
      <BalanceHead>
        <div>
          <BalanceText title noMargin>
            {(!hideBalance && formatTokenBalance(balance)) ||
              "*".repeat(balance.toFixed(2).length)}
            <Ticker>AR</Ticker>
          </BalanceText>
          <FiatBalanceText noMargin>
            {(!hideBalance &&
              formatFiatBalance(fiat, currency.toLowerCase())) ||
              "*".repeat(fiat.toFixed(2).length) + " " + currency.toUpperCase()}
            <IconButtons>
              <Tooltip
                content={browser.i18n.getMessage(
                  hideBalance ? "balance_show" : "balance_hide"
                )}
              >
                <BalanceIconButton
                  onClick={() => setHideBalance((val) => !val)}
                  as={hideBalance ? EyeOffIcon : EyeIcon}
                />
              </Tooltip>
              <Tooltip content={browser.i18n.getMessage("lock_wallet")}>
                <BalanceIconButton onClick={lockWallet} as={LockIcon} />
              </Tooltip>
            </IconButtons>
          </FiatBalanceText>
        </div>
        {activeAppData && (
          <ActiveAppIcon
            outline={theme === "light" ? "#000" : "#232323"}
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL(
                  `tabs/dashboard.html#/apps/${activeApp.url}`
                )
              })
            }
            title={activeAppData.name || ""}
          >
            {(activeAppData.logo && (
              <img
                src={activeAppData.logo}
                alt={activeAppData.name || ""}
                draggable={false}
              />
            )) || <NoAppIcon />}
          </ActiveAppIcon>
        )}
      </BalanceHead>
    </Graph>
  );
}

async function balanceHistory(address: string, gateway = defaultGateway) {
  const arweave = new Arweave(gateway);

  // find txs coming in and going out
  const inTxs = (
    await gql(
      `
      query($recipient: String!) {
        transactions(recipients: [$recipient], first: 100) {
          edges {
            node {
              owner {
                address
              }
              fee {
                ar
              }
              quantity {
                ar
              }
              block {
                timestamp
              }
            }
          }
        }
      }
    `,
      { recipient: address }
    )
  ).data.transactions.edges;
  const outTxs = (
    await gql(
      `
      query($owner: String!) {
        transactions(owners: [$owner], first: 100) {
          edges {
            node {
              owner {
                address
              }
              fee {
                ar
              }
              quantity {
                ar
              }
              block {
                timestamp
              }
            }
          }
        }
      }    
    `,
      { owner: address }
    )
  ).data.transactions.edges;

  // sort txs
  const txs = inTxs
    .concat(outTxs)
    .map((edge) => edge.node)
    .filter((tx) => !!tx?.block?.timestamp)
    .sort((a, b) => a.block.timestamp - b.block.timestamp);

  // get initial balance
  let balance = parseFloat(
    arweave.ar.winstonToAr(await arweave.wallets.getBalance(address))
  );

  const res = [balance];

  // go back in time by tx and calculate
  // historical balance
  for (const tx of txs) {
    balance -= parseFloat(tx.fee.ar);

    if (tx.owner.address === address) {
      balance -= parseFloat(tx.quantity.ar);
    } else {
      balance += parseFloat(tx.quantity.ar);
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
  gap: 0.41rem;
  font-weight: 400;
`;

const IconButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.21rem;
`;

const BalanceIconButton = styled(EyeIcon)`
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

const ActiveAppIcon = styled(AppIcon)`
  transition: all 0.07s ease-in-out;

  &:active {
    transform: scale(0.93);
  }
`;
