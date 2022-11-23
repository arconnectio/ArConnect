import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { EyeIcon, MessageIcon, ShareIcon } from "@iconicicons/react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Section, Spacer, Text } from "@arconnect/components";
import { useMemo, useRef, useState } from "react";
import { getCommunityUrl } from "~utils/format";
import { Link } from "../token/[id]";
import Thumbnail from "~components/popup/asset/Thumbnail";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import Title from "~components/popup/Title";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Collectible({ id }: Props) {
  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const state = useSandboxedTokenState(id, sandbox);

  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return new Map(state.settings);
  }, [state]);

  const chatLinks = useMemo<string[]>(() => {
    const val = settings?.get("communityDiscussionLinks");

    if (!val) return [];

    return val as string[];
  }, [settings]);

  // price
  const [price, setPrice] = useState<number>();

  return (
    <>
      <Head title={browser.i18n.getMessage("collectible")} />
      <Spacer y={0.75} />
      <Thumbnail src={`${concatGatewayURL(defaultGateway)}/${id}`} />
      <Section>
        <AnimatePresence>
          {state && (
            <motion.div
              variants={chartAnimation}
              initial="hidden"
              animate="shown"
              exit="hidden"
            >
              <Title heading noMargin>
                {state?.name || state?.ticker || ""}
              </Title>
              {price && (
                <Price noMargin>
                  {price}
                  <span>AR</span>
                </Price>
              )}
              <Spacer y={1} />
              <Description>
                {(settings && settings.get("communityDescription")) ||
                  state?.description ||
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
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
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

const Price = styled(Text)`
  font-size: 1.075rem;
  font-weight: 600;

  span {
    font-size: 0.63em;
  }
`;

const Description = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
  text-align: justify;
`;

const chartAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};
