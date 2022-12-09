import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  EyeIcon,
  GlobeIcon,
  MessageIcon,
  ShareIcon
} from "@iconicicons/react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Section, Spacer, Text } from "@arconnect/components";
import { useEffect, useMemo, useRef, useState } from "react";
import { getInteractionsForAddress } from "~tokens/token";
import { defaultGateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { getCommunityUrl } from "~utils/format";
import { getTokenLogo } from "~lib/viewblock";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import PriceChart from "~components/popup/asset/PriceChart";
import TokenLoading from "~components/popup/asset/Loading";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import Title from "~components/popup/Title";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Asset({ id }: Props) {
  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const { state, validity, loading } = useSandboxedTokenState(id, sandbox);

  // price period
  const [period, setPeriod] = useState("Day");

  // community settings
  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return new Map(state.settings);
  }, [state]);

  // chat link urls
  const chatLinks = useMemo<string[]>(() => {
    const val = settings?.get("communityDiscussionLinks");

    if (!val) return [];

    return val as string[];
  }, [settings]);

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // balance in units of the token
  const tokenBalance = useMemo(() => {
    if (!state) return "0";

    const val = state.balances?.[activeAddress] || 0;

    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [state, activeAddress]);

  // location
  const [, setLocation] = useLocation();

  // token gateway
  const [tokens] = useTokens();
  const gateway = useMemo(
    () => tokens.find((t) => t.id === id)?.gateway || defaultGateway,
    [id]
  );

  // fetch interactions
  const [interactions, setInteractions] = useState<TokenInteraction[]>([]);

  useEffect(() => {
    (async () => {
      if (!activeAddress || !validity || !id) {
        return;
      }

      // fetch interactions
      const allInteractions = await getInteractionsForAddress(
        id,
        activeAddress,
        gateway
      );

      // compare validity
      const validInteractions: TokenInteraction[] = allInteractions
        .filter((tx) => !!validity[tx.node.id])
        .map((tx) => {
          // interaction input
          const input = JSON.parse(
            tx.node.tags.find((tag) => tag.name === "Input")?.value
          );
          const recipient = tx.node.recipient || input.target;

          // interaction data
          let type: TokenInteractionType = "interaction";
          let qty = Number(tx.node.quantity.ar);
          let otherAddress: string;

          if (input.function === "transfer") {
            type = (recipient === activeAddress && "in") || "out";
            qty = Number(input.qty);
            otherAddress =
              (recipient === activeAddress && tx.node.owner.address) ||
              recipient;
          }

          // parsed interaction data
          return {
            id: tx.node.id,
            type,
            qty:
              qty.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
              " " +
              (type === "interaction" ? "AR" : state?.ticker || ""),
            function: input.function,
            otherAddress
          };
        });

      setInteractions(validInteractions);
    })();
  }, [id, activeAddress, validity, state, gateway]);

  return (
    <>
      <Head title={browser.i18n.getMessage("asset")} />
      <Spacer y={0.75} />
      <AnimatePresence>
        {state && (
          <motion.div
            variants={chartAnimation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <PriceChart
              token={{
                name: state.name || state.ticker || "",
                ticker: state.ticker || "",
                logo: getTokenLogo(id, "dark")
              }}
              priceData={[]}
              latestPrice={0}
            >
              <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
            </PriceChart>
            <Spacer y={0.15} />
            <Section>
              <BalanceSection>
                <div>
                  <BalanceLabel>
                    {browser.i18n.getMessage("your_balance")}
                  </BalanceLabel>
                  <Spacer y={0.38} />
                  <TokenBalance>
                    {tokenBalance}
                    <span>{state.ticker || ""}</span>
                  </TokenBalance>
                  {/*<FiatBalance>
                    $13.45 USD
                  </FiatBalance>*/}
                  <FiatBalance>$?? USD</FiatBalance>
                </div>
                <TokenActions>
                  <TokenAction onClick={() => setLocation(`/send/${id}`)} />
                  <ActionSeparator />
                  <TokenAction
                    as={ArrowDownLeftIcon}
                    onClick={() => setLocation("/receive")}
                  />
                </TokenActions>
              </BalanceSection>
              <Spacer y={1.45} />
              <Title noMargin>{browser.i18n.getMessage("about_title")}</Title>
              <Spacer y={0.6} />
              <Description>
                {(settings && settings.get("communityDescription")) ||
                  state.description ||
                  browser.i18n.getMessage("no_description")}
              </Description>
              <Spacer y={1.45} />
              <Title noMargin>{browser.i18n.getMessage("info_title")}</Title>
              <Spacer y={0.6} />
              {chatLinks.map((link, i) => (
                <div key={i}>
                  <Link href={link}>
                    <MessageIcon />
                    {getCommunityUrl(link)}
                  </Link>
                  <Spacer y={0.22} />
                </div>
              ))}
              {settings?.get("communityAppUrl") && (
                <>
                  <Link href={settings.get("communityAppUrl") as string}>
                    <ShareIcon />
                    {getCommunityUrl(settings.get("communityAppUrl") as string)}
                  </Link>
                  <Spacer y={0.22} />
                </>
              )}
              <Link href={`https://sonar.warp.cc/#/app/contract/${id}`}>
                <GlobeIcon />
                Sonar
              </Link>
              <Spacer y={0.22} />
              <Link href={`https://viewblock.io/arweave/address/${id}`}>
                <EyeIcon />
                Viewblock
              </Link>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{loading && <TokenLoading />}</AnimatePresence>
      <iframe
        src={browser.runtime.getURL("tabs/sandbox.html")}
        ref={sandbox}
        style={{ display: "none" }}
      ></iframe>
    </>
  );
}

interface Props {
  id: string;
}

const chartAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const BalanceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceLabel = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.69rem;
`;

const TokenBalance = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  display: flex;
  gap: 0.3rem;
  align-items: baseline;
  font-size: 1.85rem;
  line-height: 1.1em;

  span {
    font-size: 0.57em;
    text-transform: uppercase;
  }
`;

const FiatBalance = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.primaryText});
  font-weight: 600;
  font-size: 0.74rem;
`;

const TokenActions = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  padding: 0.55rem 0.74rem;
  gap: 0.74rem;
  border-radius: 14px;
`;

const TokenAction = styled(ArrowUpRightIcon)`
  font-size: 1.45rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  color: rgb(${(props) => props.theme.theme});
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const ActionSeparator = styled.div`
  width: 1.5px;
  height: 1.25rem;
  background-color: rgba(${(props) => props.theme.theme}, 0.3);
  border-radius: 2px;
`;

const Description = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
  text-align: justify;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopen noreferer"
})`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.23s ease-in-out;

  svg {
    font-size: 1.2em;
    width: 1em;
    height: 1em;
  }

  &:hover {
    opacity: 0.8;
  }
`;

type TokenInteractionType = "interaction" | "in" | "out";

interface TokenInteraction {
  id: string;
  type: TokenInteractionType;
  // qty + ticker
  qty: string;
  // recipient for outgoing txs
  // sender for incoming txs
  otherAddress?: string;
  // interaction function
  function: string;
}
