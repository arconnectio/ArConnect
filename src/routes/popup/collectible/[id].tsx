import { EyeIcon, MessageIcon, ShareIcon, GlobeIcon } from "@iconicicons/react";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { Section, Spacer, Text } from "@arconnect/components";
import { getSettings, TokenState } from "~tokens/token";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getCommunityUrl } from "~utils/format";
import { getContract } from "~lib/warp";
import { Link } from "../token/[id]";
import { useTokens } from "~tokens";
import TokenLoading from "~components/popup/asset/Loading";
import Thumbnail from "~components/popup/asset/Thumbnail";
import Skeleton from "~components/Skeleton";
import browser from "webextension-polyfill";
import Title from "~components/popup/Title";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Collectible({ id }: Props) {
  // load state
  const [state, setState] = useState<TokenState>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { state } = await getContract<TokenState>(id);

      setState(state);
      setLoading(false);
    })();
  }, [id]);

  // community settings
  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return getSettings(state);
  }, [state]);

  // links
  const chatLinks = useMemo<string[]>(() => {
    const val = settings?.get("communityDiscussionLinks");

    if (!val) return [];

    return val as string[];
  }, [settings]);

  // price
  const [price, setPrice] = useState<number>();

  // token gateway
  const tokens = useTokens();
  const gateway = useMemo(
    () => tokens.find((t) => t.id === id)?.gateway || defaultGateway,
    [id]
  );

  return (
    <>
      <Head title={browser.i18n.getMessage("collectible")} />
      <Spacer y={0.75} />
      <Thumbnail src={`${concatGatewayURL(gateway)}/${id}`} />
      <Section>
        <Title heading noMargin>
          {state?.name || state?.ticker || <Skeleton width="6rem" />}
        </Title>
        {price && (
          <Price noMargin>
            {price}
            <span>AR</span>
          </Price>
        )}
        <Spacer y={1} />
        <Description>
          {(state && (
            <>
              {(settings && settings.get("communityDescription")) ||
                state?.description ||
                browser.i18n.getMessage("no_description")}
            </>
          )) ||
            new Array(5)
              .fill("")
              .map((_, i) => (
                <Skeleton
                  addMargin
                  height="1rem"
                  width={i === 4 ? "80%" : "100%"}
                  key={i}
                />
              ))}
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
        {(!loading && (
          <>
            <Link href={`https://sonar.warp.cc/#/app/contract/${id}`}>
              <GlobeIcon />
              Sonar
            </Link>
            <Spacer y={0.22} />
            <Link href={`https://viewblock.io/arweave/address/${id}`}>
              <EyeIcon />
              Viewblock
            </Link>
          </>
        )) ||
          new Array(4)
            .fill("")
            .map((_, i) => (
              <Skeleton addMargin height="1rem" width="6.8rem" key={i} />
            ))}
      </Section>
      <AnimatePresence>{loading && <TokenLoading />}</AnimatePresence>
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
