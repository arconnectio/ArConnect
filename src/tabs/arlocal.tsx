import {
  Button,
  Input,
  Provider,
  Spacer,
  useInput,
  Text,
  InputStatus
} from "@arconnect/components";
import styled, { css, keyframes } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { CopyIcon, RefreshIcon } from "@iconicicons/react";
import {
  CardBody,
  ConnectionStatus,
  ConnectionText,
  Title,
  Wrapper
} from "./devtools";
import { useEffect, useState } from "react";
import axios from "axios";
import copy from "copy-to-clipboard";

export default function Popup() {
  const theme = useTheme();

  // testnet data
  const testnetInput = useInput();
  const [lastUsedTestnet, setLastUsedTestnet] = useStorage<string>(
    {
      key: "last_used_testnet",
      area: "local",
      isSecret: true
    },
    (val) => val || "http://localhost:1984"
  );

  useEffect(() => {
    if (lastUsedTestnet === testnetInput.state) {
      return;
    }

    testnetInput.setState(lastUsedTestnet);
  }, [lastUsedTestnet]);

  // fetch testnet status
  const [online, setOnline] = useState(false);
  const [loadingTestnet, setLoadingTestnet] = useState(false);

  // load testnet for the first time
  const [loadedTestnet, setLoadedTestnet] = useState(false);

  useEffect(() => {
    (async () => {
      if (!lastUsedTestnet || loadedTestnet) return;

      await loadTestnet(lastUsedTestnet);
      setLoadedTestnet(true);
    })();
  }, [lastUsedTestnet]);

  // try to load in the testnet
  async function loadTestnet(url?: string) {
    const testnetUrl = url || testnetInput.state;

    if (!testnetUrl || testnetUrl === "") {
      return testnetInput.setStatus("error");
    }

    testnetInput.setStatus("default");
    setLoadingTestnet(true);
    await setLastUsedTestnet(testnetUrl);

    try {
      await axios.get(testnetUrl);

      setOnline(true);
    } catch {
      setOnline(false);
    }

    setTimeout(() => setLoadingTestnet(false), 400);
  }

  // arlocal command input status
  const [arLocalCommandStatus, setArLocalCommandStatus] =
    useState<InputStatus>("default");

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Wrapper>
        <CardBody>
          <Title>
            ArLocal Devtools
            <Spacer x={0.2} />
            <Text noMargin>by ArConnect</Text>
          </Title>
          <ConnectionText>
            {"Testnet is " + (!online ? "not " : "") + "live"}
            <ConnectionStatus connected={online} />
          </ConnectionText>
          <Spacer y={1.5} />
          <TestnetUrl>
            <InputWrapper>
              <Input
                {...testnetInput.bindings}
                type="text"
                label="Testnet gateway url"
                placeholder="http://localhost:1984"
                fullWidth
              />
            </InputWrapper>
            <RefreshButton
              secondary
              onClick={() => loadTestnet()}
              loading={loadingTestnet}
            >
              <RefreshIcon />
            </RefreshButton>
          </TestnetUrl>
          <Spacer y={1} />
          {!online && (
            <>
              <Text noMargin>
                Don't have ArLocal installed? Run it like this:
              </Text>
              <Spacer y={0.4} />
              <TestnetUrl>
                <InputWrapper>
                  <Input
                    type="text"
                    fullWidth
                    readOnly
                    defaultValue="npx arlocal"
                    status={arLocalCommandStatus}
                  />
                </InputWrapper>
                <RefreshButton
                  secondary
                  onClick={() => {
                    copy("npx arlocal");
                    setArLocalCommandStatus("success");
                  }}
                >
                  <CopyIcon />
                </RefreshButton>
              </TestnetUrl>
              <Spacer y={1} />
            </>
          )}
        </CardBody>
      </Wrapper>
    </Provider>
  );
}

const TestnetUrl = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.8rem;
`;

const InputWrapper = styled.div`
  width: 100%;
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

// @ts-ignore
const rotation = css`
  ${rotate} 0.5s linear infinite
`;

const RefreshButton = styled(Button)<{ loading?: boolean }>`
  padding: 1.2rem;
  transition: all 0.23s ease-in-out;

  svg {
    animation: ${(props) => (props.loading ? rotation : "none")};
  }
`;
