import { CopyIcon, PlusIcon, RefreshIcon, TrashIcon } from "@iconicicons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { formatAddress } from "~utils/format";
import { readFileBinary } from "~utils/file";
import { getActiveKeyfile } from "~wallets";
import { unlock } from "~wallets/auth";
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
import {
  CardBody,
  ConnectionStatus,
  ConnectionText,
  Title,
  Wrapper
} from "./devtools";
import browser from "webextension-polyfill";
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
          content: browser.i18n.getMessage("gatewayNotTestnet"),
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
        content: browser.i18n.getMessage("arMinted", [
          testnetQty.state,
          formatAddress(activeAddress, 8)
        ]),
        duration: 3000
      });
    } catch (e) {
      console.log("Failed to mint tokens", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("tokenMintFailed"),
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
        content: browser.i18n.getMessage("mined"),
        duration: 2350
      });
    } catch (e) {
      console.log("Failed to mine", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("miningFailed"),
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
          content: browser.i18n.getMessage("fillOutQtyField"),
          duration: 2400
        });
      } else if (txQtyInput.state !== "" && txTargetInput.state === "") {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("fillOutTargetField"),
          duration: 2400
        });
      } else if (
        txQtyInput.state === "" &&
        txTargetInput.state === "" &&
        !file
      ) {
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("addFileError"),
          duration: 2400
        });
      }
    }

    setSendingTx(true);

    let txData: ArrayBuffer | undefined = undefined;

    try {
      // read file
      if (!!file) {
        txData = await readFileBinary(file);
      }
    } catch (e) {
      console.log("Error reading file", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("couldNotReadTxData"),
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
          content: browser.i18n.getMessage("invalidPassword"),
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
        txTargetInput.state !== ""
          ? {
              target: txTargetInput.state,
              quantity: arweave.ar.arToWinston(txQtyInput.state),
              data: txData
            }
          : { data: txData },
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
        content: browser.i18n.getMessage("txSent"),
        duration: 2400
      });
    } catch (e) {
      console.log("Error sending tx", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("txFailed"),
        duration: 2400
      });
    }

    setSendingTx(false);
  }

  return (
    <Wrapper>
      <CardBody>
        <Title>
          ArLocal {browser.i18n.getMessage("devtools")}
          <Spacer x={0.2} />
          <Text noMargin>by ArConnect</Text>
        </Title>
        <ConnectionText>
          {browser.i18n.getMessage(online ? "testnetLive" : "testnetDown")}
          <ConnectionStatus connected={online} />
        </ConnectionText>
        <Spacer y={1.5} />
        <InputWithBtn>
          <InputWrapper>
            <Input
              {...testnetInput.bindings}
              type="text"
              label={browser.i18n.getMessage("testnetGatewayUrlLabel")}
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
              {browser.i18n.getMessage("arlocalCommandTutorial")}
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
              {browser.i18n.getMessage("mintAr")}
            </Text>
            <Text>{browser.i18n.getMessage("addTestnetTokensSubtitle")}</Text>
            <InputWithBtn>
              <InputWrapper>
                <Input
                  {...testnetQty.bindings}
                  type="number"
                  placeholder={browser.i18n.getMessage("arQtyPlaceholder")}
                  fullWidth
                />
              </InputWrapper>
              <Button secondary onClick={mint}>
                {browser.i18n.getMessage("mint")}
              </Button>
            </InputWithBtn>
            <Spacer y={1} />
            <Text heading noMargin>
              {browser.i18n.getMessage("createTransaction")}
            </Text>
            <Text>{browser.i18n.getMessage("createTransactionSubtitle")}</Text>
            <Inputs>
              <HalfInputWrapper>
                <Input
                  type="text"
                  label={browser.i18n.getMessage("target")}
                  placeholder={browser.i18n.getMessage("leaveEmptyForNone")}
                  fullWidth
                  {...txTargetInput.bindings}
                />
              </HalfInputWrapper>
              <HalfInputWrapper>
                <Input
                  type="number"
                  label={browser.i18n.getMessage("amount")}
                  placeholder={browser.i18n.getMessage("leaveEmptyForNone")}
                  fullWidth
                  {...txQtyInput.bindings}
                />
              </HalfInputWrapper>
            </Inputs>
            <Spacer y={1} />
            <Text>{browser.i18n.getMessage("tags")}</Text>
            {tags.map((tag, i) => (
              <div key={i}>
                <InputWithBtn>
                  <InputWrapper>
                    <Input
                      type="text"
                      label={browser.i18n.getMessage("name")}
                      placeholder={browser.i18n.getMessage(
                        "tagNamePlaceholder"
                      )}
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
                      label={browser.i18n.getMessage("value")}
                      placeholder={browser.i18n.getMessage(
                        "tagValuePlaceholder"
                      )}
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
              <PlusIcon /> {browser.i18n.getMessage("addTag")}
            </Button>
            <Spacer y={1} />
            <Text>{browser.i18n.getMessage("data")}</Text>
            <FileInput inputRef={fileInput}>
              {browser.i18n.getMessage("dragAndDropFile")}
            </FileInput>
            {!decryptionKey && (
              <>
                <Spacer y={1} />
                <Input
                  {...passwordInput.bindings}
                  type="password"
                  label={browser.i18n.getMessage("password")}
                  placeholder={browser.i18n.getMessage(
                    "enterPasswordToDecrypt"
                  )}
                />
              </>
            )}
            <Spacer y={1.35} />
            <Button fullWidth loading={sendingTx} onClick={sendTransaction}>
              {browser.i18n.getMessage("sendTransaction")}
            </Button>
            <Spacer y={1} />
            <Button fullWidth secondary loading={mining} onClick={mine}>
              {browser.i18n.getMessage("mine")}
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
