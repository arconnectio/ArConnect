import { EyeIcon, MessageIcon, ShareIcon, GlobeIcon } from "@iconicicons/react";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { Section, Spacer, Text } from "@arconnect/components";
import { getSettings, type TokenState } from "~tokens/token";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import { useEffect, useMemo, useState } from "react";
import { getDreForToken, useTokens } from "~tokens";
import { AnimatePresence } from "framer-motion";
import { getCommunityUrl } from "~utils/format";
import { Link } from "../token/[id]";
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

      const dre = await getDreForToken(id);
      const contract = new DREContract(id, new DRENode(dre));
      const { state } = await contract.getState<TokenState>();

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
            <Link href={`https://bazar.arweave.dev/#/asset/${id}`}>
              <BazarIcon />
              Bazar
            </Link>
            <Spacer y={0.22} />
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

const BazarIcon = () => (
  <svg
    width="1900"
    height="1900"
    viewBox="0 0 1900 1900"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_1849_336)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M930.935 376.467L782.693 559.057L904.96 748.959L1066.06 748.958L1190.79 562.462L930.935 376.467ZM1226.92 508.444L951.944 311.626C933.455 298.393 907.862 301.838 893.53 319.491L745.69 501.585L634.02 328.141C617.287 302.153 579.427 301.774 562.178 327.42L277.268 751.019C239.34 759.531 211.001 793.413 211.001 833.916L211 1204.55C211 1237.39 232.07 1265.31 261.427 1275.52C230.109 1309.55 211 1355.12 211 1405.07C211 1509.87 295.13 1595.42 399.642 1595.42C504.155 1595.42 588.285 1509.87 588.285 1405.07C588.285 1357.12 570.678 1313.21 541.567 1279.67H1358.43C1329.32 1313.21 1311.72 1357.12 1311.72 1405.07C1311.72 1509.87 1395.85 1595.42 1500.36 1595.42C1604.87 1595.42 1689 1509.87 1689 1405.07C1689 1355.44 1670.13 1310.12 1639.17 1276.16C1668.09 1266.78 1689 1239.61 1689 1207.56V869.217C1689 803.888 1636.92 750.726 1572.02 749.002L1398.35 423.984C1375.24 380.721 1314.36 377.711 1287.09 418.483L1226.92 508.444ZM1568.97 813.916C1568.9 813.916 1568.83 813.916 1568.76 813.916H295.947C284.902 813.916 275.949 822.87 275.949 833.916L275.948 1204.55C275.948 1210.16 280.497 1214.71 286.108 1214.71H1616.9C1620.85 1214.71 1624.05 1211.51 1624.05 1207.56V869.217C1624.05 838.744 1599.41 814.027 1568.97 813.916ZM1498.35 748.958H1144.19L1341.07 454.598L1498.35 748.958ZM399.642 1279.67C467.629 1279.67 523.337 1335.48 523.337 1405.07C523.337 1474.65 467.63 1530.46 399.642 1530.46C331.655 1530.46 275.948 1474.65 275.948 1405.07C275.948 1335.48 331.656 1279.67 399.642 1279.67ZM356.929 748.959H827.711L597.461 391.34L356.929 748.959ZM1500.36 1279.67C1432.37 1279.67 1376.66 1335.48 1376.66 1405.07C1376.66 1474.65 1432.37 1530.46 1500.36 1530.46C1568.35 1530.46 1624.05 1474.65 1624.05 1405.07C1624.05 1335.48 1568.35 1279.67 1500.36 1279.67Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M399.642 1562.94C313.393 1562.94 243.474 1492.26 243.474 1405.07C243.474 1317.88 313.393 1247.19 399.642 1247.19C485.892 1247.19 555.811 1317.88 555.811 1405.07C555.811 1492.26 485.892 1562.94 399.642 1562.94ZM523.337 1405.07C523.337 1335.48 467.628 1279.67 399.642 1279.67C331.656 1279.67 275.948 1335.48 275.948 1405.07C275.948 1474.65 331.655 1530.46 399.642 1530.46C467.629 1530.46 523.337 1474.65 523.337 1405.07Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1500.36 1562.94C1414.1 1562.94 1344.19 1492.26 1344.19 1405.07C1344.19 1317.88 1414.1 1247.19 1500.36 1247.19C1586.61 1247.19 1656.53 1317.88 1656.53 1405.07C1656.53 1492.26 1586.61 1562.94 1500.36 1562.94ZM1500.36 1279.67C1432.37 1279.67 1376.66 1335.48 1376.66 1405.07C1376.66 1474.65 1432.37 1530.46 1500.36 1530.46C1568.35 1530.46 1624.05 1474.65 1624.05 1405.07C1624.05 1335.48 1568.35 1279.67 1500.36 1279.67Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_1849_336">
        <rect
          width="1478"
          height="1293"
          fill="white"
          transform="translate(211 303)"
        />
      </clipPath>
    </defs>
  </svg>
);
