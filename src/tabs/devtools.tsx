import { Card, Provider, Spacer, Text } from "@arconnect/components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { getTab } from "~applications/tab";
import { getAppURL } from "~utils/format";
import Connector from "~components/devtools/Connector";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Devtools() {
  // fetch app data
  const [app, setApp] = useState<Application>();

  useEffect(() => {
    (async () => {
      // get if app is connected
      const tab = await getTab(browser.devtools.inspectedWindow.tabId);
      const appURL = getAppURL(tab.url);
      const app = new Application(appURL);

      setApp(app);
    })();
  }, []);

  // connected apps
  const [connectedApps] = useStorage<string[]>(
    {
      key: "apps",
      area: "local",
      isSecret: true
    },
    []
  );

  // app connected
  const connected = useMemo(() => {
    if (!app) return false;

    return connectedApps.includes(app.url);
  }, [app, connectedApps]);

  // ui theme
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Wrapper>
        <CardBody>
          <Title>ArConnect {browser.i18n.getMessage("devtools")}</Title>
          <ConnectionText>
            {browser.i18n.getMessage(
              connected ? "appConnected" : "appNotConnected"
            )}
            <ConnectionStatus connected={connected} />
          </ConnectionText>
          <Spacer y={1.5} />
          {(!connected && app && <Connector appUrl={app.url} />) ||
            (connected && app && <>app settings here</>)}
        </CardBody>
      </Wrapper>
    </Provider>
  );
}

export const Wrapper = styled.div`
  padding: 1rem;
  width: calc(100vw - 1rem * 2);
  min-height: calc(100vh - 1rem * 2);
`;

export const CardBody = styled(Card)`
  min-height: calc(100% - 1rem * 2);
`;

export const Title = styled(Text).attrs({
  subtitle: true,
  noMargin: true
})`
  display: flex;
  align-items: flex-start;
  font-weight: 600;
`;

export const ConnectionText = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.34rem;
`;

export const ConnectionStatus = styled.span<{ connected: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 100%;
  background-color: ${(props) => (props.connected ? "#14D110" : "#ff0000")};
`;
