import { Button, Card, Provider, Spacer, Text } from "@arconnect/components";
import { permissionData, PermissionType } from "~applications/permissions";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useEffect, useState } from "react";
import { getTab } from "~applications/tab";
import { getAppURL } from "~utils/format";
import { addApp } from "~applications";
import PermissionCheckbox, {
  PermissionDescription
} from "~components/auth/PermissionCheckbox";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Devtools() {
  // fetch app data
  const [connected, setConnected] = useState(false);
  const [app, setApp] = useState<Application>();

  useEffect(() => {
    (async () => {
      // get if app is connected
      const tab = await getTab(browser.devtools.inspectedWindow.tabId);
      const appURL = getAppURL(tab.url);
      const app = new Application(appURL);
      const connected = await app.isConnected();

      setConnected(connected);

      // set app if connected
      if (connected) {
        setApp(app);
      }
    })();
  }, []);

  // permissions to "force-connect" the app with
  const [permsToConnect, setPermsToConnect] = useState<PermissionType[]>([]);

  // ui theme
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Wrapper>
        <CardBody>
          <Title>ArConnect Devtools</Title>
          <ConnectionText>
            {"App " + (!connected ? "not " : "") + "connected"}
            <ConnectionStatus connected={connected} />
          </ConnectionText>
          <Spacer y={1.5} />
          {!connected && (
            <>
              {Object.keys(permissionData).map(
                (permissionName: PermissionType, i) => (
                  <div key={i}>
                    <PermissionCheckbox
                      onChange={(checked) =>
                        setPermsToConnect((val) => {
                          // toggle permission
                          if (checked && !val.includes(permissionName)) {
                            return [...val, permissionName];
                          } else if (!checked) {
                            return val.filter((p) => p !== permissionName);
                          }

                          return val;
                        })
                      }
                    >
                      {permissionName}
                      <br />
                      <PermissionDescription>
                        {permissionData[permissionName]}
                      </PermissionDescription>
                    </PermissionCheckbox>
                    <Spacer y={0.8} />
                  </div>
                )
              )}
              <Spacer y={1.15} />
              <Button
                fullWidth
                disabled={permsToConnect.length === 0}
                onClick={() => {
                  if (permsToConnect.length === 0) return;
                  addApp({
                    url: app.url,
                    permissions: permsToConnect
                  });
                }}
              >
                Force Connect
              </Button>
            </>
          )}
        </CardBody>
      </Wrapper>
    </Provider>
  );
}

export const Wrapper = styled.div`
  padding: 1rem;
  width: calc(100vw - 1rem * 2);
  height: calc(100vh - 1rem * 2);
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
