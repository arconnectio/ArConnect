import {
  Button,
  Input,
  Provider,
  Spacer,
  useInput,
  Text,
  InputStatus,
  useToasts,
  FileInput
} from "@arconnect/components";
import styled, { css, keyframes } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { CopyIcon, PlusIcon, RefreshIcon, TrashIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import {
  CardBody,
  ConnectionStatus,
  ConnectionText,
  Title,
  Wrapper
} from "./devtools";
import { useEffect, useMemo, useRef, useState } from "react";
import { readFileBinary } from "~utils/file";
import { getActiveKeyfile } from "~wallets";
import { unlock } from "~wallets/auth";
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
      const { data, status, statusText } = await axios.get<{
        network: string;
      }>(testnetUrl);

      // check status
      if (status !== 200) {
        throw new Error(statusText);
      }

      // check if testnet
      if (!data.network.includes("arlocal")) {
        setToast({
          type: "error",
          content: "Gateway is not a testnet network",
          duration: 3000
        });

        throw new Error(
          `Gateway not testnet. Gateway network type: ${data.network}`
        );
      }

      setOnline(true);
    } catch (e) {
      console.log("Failed to load gateway", e);
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

  // arweave client
  const arweave = useMemo(() => {
    // construct client
    const gatewayURL = new URL(lastUsedTestnet);
    const arweave = new Arweave({
      host: gatewayURL.host,
      port: gatewayURL.port,
      protocol: gatewayURL.protocol.replace(":", "")
    });

    return arweave;
  }, [lastUsedTestnet]);

  // mint new AR
  async function mint() {
    try {
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

  // mine
  const [mining, setMining] = useState(false);

  async function mine() {
    setMining(true);

    try {
      // mine testnet
      const { status, statusText } = await arweave.api.get("mine");

      if (status !== 200) {
        throw new Error(statusText);
      }

      setToast({
        type: "success",
        content: "Mined",
        duration: 2350
      });
    } catch (e) {
      console.log("Failed to mine", e);
      setToast({
        type: "error",
        content: "Failed to mine",
        duration: 2400
      });
    }

    setMining(false);
  }

  // decryption key to check if a password is required
  const [decryptionKey] = useStorage<string>({
    key: "decryption_key",
    area: "local",
    isSecret: true
  });

  // password
  const passwordInput = useInput();

  // tx data
  const txTargetInput = useInput();
  const txQtyInput = useInput();
  const [tags, setTags] = useState<{ name: string; value: string }[]>([]);
  const [sendingTx, setSendingTx] = useState(false);
  const fileInput = useRef<HTMLInputElement>();

  async function sendTransaction() {
    if (sendingTx || !arweave) return;

    // file in the file input
    const file = fileInput.current?.files?.[0];

    // check required fields
    if (!file) {
      if (txQtyInput.state === "" && txTargetInput.state !== "") {
        return setToast({
          type: "error",
          content: "Please fill out the quantity field",
          duration: 2400
        });
      } else if (txQtyInput.state !== "" && txTargetInput.state === "") {
        return setToast({
          type: "error",
          content: "Please fill out the target field",
          duration: 2400
        });
      } else if (
        txQtyInput.state === "" &&
        txTargetInput.state === "" &&
        !file
      ) {
        return setToast({
          type: "error",
          content: "Please add a file",
          duration: 2400
        });
      }
    }

    setSendingTx(true);

    let txData: ArrayBuffer;

    try {
      // read file
      if (!!file) {
        txData = await readFileBinary(file);
      }
    } catch (e) {
      console.log("Error reading file", e);
      setToast({
        type: "error",
        content: "Could not read transaction data file",
        duration: 2400
      });
      setSendingTx(false);
      return;
    }

    // unlock if there isn't a decryption key
    if (!decryptionKey) {
      const unlockResult = await unlock(passwordInput.state);

      if (!unlockResult) {
        passwordInput.setStatus("error");
        setToast({
          type: "error",
          content: "Invalid password",
          duration: 2400
        });
        return;
      }
    }

    try {
      // get keyfile
      const keyfile = await getActiveKeyfile();

      // create tx
      const transaction = await arweave.createTransaction(
        {
          target: txTargetInput.state,
          quantity:
            txQtyInput.state !== ""
              ? arweave.ar.arToWinston(txQtyInput.state)
              : undefined,
          data: txData
        },
        keyfile
      );

      // add tags
      for (const tag of tags) {
        if (tag.name === "" || tag.value === "") continue;

        transaction.addTag(tag.name, tag.value);
      }

      // add content-type tag if there isn't one already
      if (
        file &&
        !tags.find((tag) => tag.name.toLowerCase() === "content-type")
      ) {
        transaction.addTag("Content-Type", file.type);
      }

      // sign tx
      await arweave.transactions.sign(transaction, keyfile);

      // post tx
      const uploader = await arweave.transactions.getUploader(transaction);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      // notify the user
      setToast({
        type: "success",
        content: "Sent transaction",
        duration: 2400
      });
    } catch (e) {
      console.log("Error sending tx", e);
      setToast({
        type: "error",
        content: "Could not send transaction",
        duration: 2400
      });
    }

    setSendingTx(false);
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
            refreshing={loadingTestnet}
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
            <Spacer y={1} />
            <Text heading noMargin>
              Create Transaction
            </Text>
            <Text>Send a transaction with tags and data</Text>
            <Inputs>
              <HalfInputWrapper>
                <Input
                  type="text"
                  label="Target"
                  placeholder="Leave empty for none..."
                  fullWidth
                  {...txTargetInput.bindings}
                />
              </HalfInputWrapper>
              <HalfInputWrapper>
                <Input
                  type="number"
                  label="Amount"
                  placeholder="Leave empty for none..."
                  fullWidth
                  {...txQtyInput.bindings}
                />
              </HalfInputWrapper>
            </Inputs>
            <Spacer y={1} />
            <Text>Tags</Text>
            {tags.map((tag, i) => (
              <div key={i}>
                <InputWithBtn>
                  <InputWrapper>
                    <Input
                      type="text"
                      label="Name"
                      placeholder="Tag name..."
                      fullWidth
                      value={tag.name}
                      onChange={(e) =>
                        setTags((val) =>
                          val.map((t, j) => {
                            if (j !== i) return t;

                            return {
                              ...t,
                              // @ts-expect-error
                              name: e.target.value
                            };
                          })
                        )
                      }
                    />
                  </InputWrapper>
                  <InputWrapper>
                    <Input
                      type="text"
                      label="Value"
                      placeholder="Tag value..."
                      fullWidth
                      value={tag.value}
                      onChange={(e) =>
                        setTags((val) =>
                          val.map((t, j) => {
                            if (j !== i) return t;

                            return {
                              ...t,
                              // @ts-expect-error
                              value: e.target.value
                            };
                          })
                        )
                      }
                    />
                  </InputWrapper>
                  <RefreshButton
                    secondary
                    onClick={() =>
                      setTags((val) => val.filter((_, j) => j !== i))
                    }
                  >
                    <TrashIcon />
                  </RefreshButton>
                </InputWithBtn>
                <Spacer y={1} />
              </div>
            ))}
            <Button
              fullWidth
              secondary
              onClick={() =>
                setTags((val) => [...val, { name: "", value: "" }])
              }
            >
              <PlusIcon /> Add tag
            </Button>
            <Spacer y={1} />
            <Text>Data</Text>
            <FileInput>Drag and drop a file...</FileInput>
            {!decryptionKey && (
              <>
                <Spacer y={1} />
                <Input
                  {...passwordInput.bindings}
                  type="password"
                  label="Passoword"
                  placeholder="Enter password to decrypt wallet..."
                />
              </>
            )}
            <Spacer y={1.35} />
            <Button fullWidth loading={sendingTx} onClick={sendTransaction}>
              Send Transaction
            </Button>
            <Spacer y={1} />
            <Button fullWidth secondary loading={mining} onClick={mine}>
              Mine
            </Button>
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

const Inputs = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HalfInputWrapper = styled.div`
  width: 48%;
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

const RefreshButton = styled(Button)<{ refreshing?: boolean }>`
  padding: 1.2rem;
  transition: all 0.23s ease-in-out;

  svg {
    animation: ${(props) => (props.refreshing ? rotation : "none")};
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
