import { EyeIcon, MessageIcon, ShareIcon } from "@iconicicons/react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Section, Spacer, Text } from "@arconnect/components";
import { useMemo, useRef, useState } from "react";
import { getCommunityUrl } from "~utils/format";
import { getTokenLogo } from "~lib/viewblock";
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
  const { state, loading } = useSandboxedTokenState(id, sandbox);

  // price period
  const [period, setPeriod] = useState("Day");

  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return new Map(state.settings);
  }, [state]);

  const chatLinks = useMemo<string[]>(() => {
    const val = settings?.get("communityDiscussionLinks");

    if (!val) return [];

    return val as string[];
  }, [settings]);

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
              <Title noMargin>{browser.i18n.getMessage("about_title")}</Title>
              <Spacer y={0.6} />
              <Description>
                {(settings && settings.get("communityDescription")) ||
                  state.description ||
                  browser.i18n.getMessage("no_description")}
              </Description>
              <Spacer y={1} />
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
