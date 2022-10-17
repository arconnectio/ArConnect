import {
  Button,
  Input,
  Provider,
  Spacer,
  useInput,
  Text,
  InputStatus,
  useToasts
} from "@arconnect/components";
import styled, { css, keyframes } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { CopyIcon, RefreshIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import {
  CardBody,
  ConnectionStatus,
  ConnectionText,
  Title,
  Wrapper
} from "./devtools";
import { useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import Arweave from "arweave";
import axios from "axios";

function ArLocal() {
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

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // toasts
  const { setToast } = useToasts();

  // token qty to add
  const testnetQty = useInput("1");

  // mint new AR
  async function mint() {
    try {
      // construct client
      const gatewayURL = new URL(lastUsedTestnet);
      const arweave = new Arweave({
        host: gatewayURL.host,
        port: gatewayURL.port,
        protocol: gatewayURL.protocol.replace(":", "")
      });

      // mint tokens
      const { status, statusText } = await arweave.api.get(
        `/mint/${activeAddress}/${arweave.ar.arToWinston(testnetQty.state)}`
      );

      if (status !== 200) {
        throw new Error(statusText);
      }

      setToast({
        type: "success",
        content: `Minted ${testnetQty.state} AR to ${formatAddress(
          activeAddress,
          8
        )}`,
        duration: 3000
      });
    } catch (e) {
      console.log("Failed to mint tokens", e);
      setToast({
        type: "error",
        content: "Failed to mint tokens",
        duration: 2400
      });
    }
  }

  return (
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
        <InputWithBtn>
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
        </InputWithBtn>
        <Spacer y={1} />
        {(!online && (
          <>
            <Text noMargin>
              Don't have ArLocal installed? Run it like this:
            </Text>
            <Spacer y={0.4} />
            <InputWithBtn>
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
            </InputWithBtn>
            <Spacer y={1} />
          </>
        )) || (
          <>
            <Text heading noMargin>
              Mint AR
            </Text>
            <Text>Add testnet tokens to your wallet</Text>
            <InputWithBtn>
              <InputWrapper>
                <Input
                  {...testnetQty.bindings}
                  type="number"
                  placeholder="AR qty..."
                  fullWidth
                />
              </InputWrapper>
              <Button secondary onClick={mint}>
                Mint
              </Button>
            </InputWithBtn>
          </>
        )}
      </CardBody>
    </Wrapper>
  );
}

const InputWithBtn = styled.div`
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

export default function () {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <ArLocal />
    </Provider>
  );
}
