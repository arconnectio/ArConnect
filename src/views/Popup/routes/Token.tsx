import React, { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@primer/octicons-react";
import { goTo } from "react-chrome-extension-router";
import { fetchContract } from "verto-cache-interface";
import { browser } from "webextension-polyfill-ts";
import { useTheme, Spacer } from "@verto/ui";
import { GraphOptions } from "../../../utils/graph";
import { Line } from "react-chartjs-2";
import { marked } from "marked";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import vertoLightLogo from "../../../assets/verto_light.png";
import vertoDarkLogo from "../../../assets/verto_dark.png";
import viewblockLogo from "../../../assets/viewblock.png";
import cxyzLogo from "../../../assets/communityxyz.png";
import Verto from "@verto/js";
import Home from "./Home";
import SubPageTopStyles from "../../../styles/components/SubPageTop.module.sass";
import styles from "../../../styles/views/Popup/token.module.sass";

export default function Token({ id }: { id: string }) {
  // load token type and state
  const [tokenType, setTokenType] = useState<"community" | "art">();
  const [tokenState, setTokenState] = useState<TokenState>();
  const [communitySettings, setCommunitySettings] = useState<Map<string, any>>(
    new Map([])
  );

  useEffect(() => {
    (async () => {
      try {
        const verto = new Verto();
        const type = await verto.token.getTokenType(id);
        const state = await fetchContract<TokenState>(id);

        if (!type || !state) return goTo(Home);
        if (type === "custom")
          return browser.tabs.create({
            url: `https://viewblock.io/arweave/address/${id}`
          });

        setTokenType(type);
        setTokenState(state.state);

        if (state.state.settings)
          setCommunitySettings(new Map(state.state.settings));
      } catch {
        goTo(Home);
      }
    })();
  }, [id]);

  // ui theme
  const theme = useTheme();

  // period picker
  const periods = ["24h", "1w", "1m", "1y", "ALL"];

  // format description
  const [formattedDescription, setFormattedDescription] = useState("");

  useEffect(() => {
    if (!tokenState || !communitySettings) return;
    const desc =
      tokenState.description ||
      communitySettings.get("communityDescription") ||
      "No description available...";

    setFormattedDescription(marked(desc));
  }, [tokenState, communitySettings]);

  // get how much the users owns of this token
  const [owned, setOwned] = useState(0);
  const address = useSelector((state: RootState) => state.profile);

  useEffect(() => {
    if (!tokenState) return;
    setOwned(tokenState.balances[address] || 0);
  }, [tokenState, address]);

  return (
    <>
      <div className={SubPageTopStyles.Head}>
        <div className={SubPageTopStyles.Back} onClick={() => goTo(Home)}>
          <ArrowLeftIcon />
        </div>
        <h1>{tokenState?.name || ""}</h1>
      </div>
      <div className={styles.Token}>
        {tokenState && tokenType && (
          <>
            {(tokenType === "community" && (
              <>
                <h1 className={styles.TokenName}>
                  {tokenState.name}
                  <span>({tokenState.ticker})</span>
                </h1>
                <h1 className={styles.Price}>
                  {/** TODO: price */}
                  $--.--
                </h1>
                <div className={styles.PeriodMenu}>
                  {periods.map((per, i) => (
                    <span
                      key={i}
                      //className={selectedPeriod === per ? styles.Selected : ""}
                      //onClick={() => setSelectedPeriod(per)}
                      className={
                        i === periods.length - 1 ? styles.Selected : ""
                      }
                    >
                      {per}
                    </span>
                  ))}
                </div>
                <div className={styles.PriceGraph}>
                  <Line
                    data={{
                      labels: ["", "", "", "", "", "", "", "", "", "", ""], // TODO: replace with dates / prices in implementation
                      datasets: [
                        {
                          label: "My First Dataset",
                          data: [
                            65, 9, 80, 89, 99, 32, 120, 90, 79, 18, 79, 60
                          ], // TODO: replace with real data in implementation
                          fill: false,
                          borderColor: "#000",
                          tension: 0.1
                        }
                      ]
                    }}
                    options={GraphOptions({
                      theme,
                      tooltipText: ({ value }) =>
                        `${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2
                        })} AR`
                    })}
                  />
                  <div
                    className={
                      styles.NoPrice +
                      " " +
                      ((theme === "Dark" && styles.DarkNoPrice) || "")
                    }
                  >
                    No price data...
                  </div>
                </div>
              </>
            )) || (
              <>
                <img
                  src={`https://arweave.net/${id}`}
                  className={styles.ArtPreview}
                  alt=""
                  draggable={false}
                />
                <h1 className={styles.Owned}>
                  {owned}
                  <span>{tokenState.ticker}</span>
                </h1>
                <p className={styles.ArtPrice}>$---.--</p>
                <Spacer y={1.3} />
              </>
            )}
            <div className={styles.AboutToken}>
              <div className={styles.AboutMenu}>
                <span className={styles.Selected}>About</span>
                <span style={{ cursor: "not-allowed" }}>Swap</span>
              </div>
              <div
                className={styles.Description}
                dangerouslySetInnerHTML={{ __html: formattedDescription }}
              />
              <ul>
                {communitySettings.get("communityAppUrl") && (
                  <li>
                    <a
                      href={tokenState.settings.communityAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {communitySettings
                        .get("communityAppUrl")
                        .replace(/((http(s?)):\/\/)|(\/$)/g, "")}
                    </a>
                  </li>
                )}
                {communitySettings.get("communityDiscussionLinks") &&
                  communitySettings
                    .get("communityDiscussionLinks")
                    .map((url: string, i: number) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {url.replace(/((http(s?)):\/\/)|(\/$)/g, "")}
                        </a>
                      </li>
                    ))}
              </ul>
              <div className={styles.TokenLinkIcons}>
                <img
                  src={theme === "Dark" ? vertoDarkLogo : vertoLightLogo}
                  alt="v"
                  onClick={() =>
                    browser.tabs.create({
                      url: `https://verto.exchange/space/${id}`
                    })
                  }
                />
                <img
                  src={viewblockLogo}
                  alt="b"
                  onClick={() =>
                    browser.tabs.create({
                      url: `https://viewblock.io/arweave/address/${id}`
                    })
                  }
                />
                {tokenType === "community" && (
                  <img
                    src={cxyzLogo}
                    alt="c"
                    onClick={() =>
                      browser.tabs.create({
                        url: `https://community.xyz/#${id}`
                      })
                    }
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

interface TokenState {
  name: string;
  ticker: string;
  balances: {
    [address: string]: number;
  };
  [key: string]: any;
}
