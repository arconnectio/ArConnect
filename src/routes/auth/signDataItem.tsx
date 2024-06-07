import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  ButtonV2,
  InputV2,
  ListItem,
  Loading,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { svgie } from "~utils/svgies";
import { formatAddress } from "~utils/format";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { checkPassword } from "~wallets/auth";
import { Quantity, Token } from "ao-tokens";
import { getUserAvatar } from "~lib/avatar";
import { useAo } from "~tokens/aoTokens/ao";

interface Tag {
  name: string;
  value: string;
}

interface DataStructure {
  data: number[];
  target?: string;
  tags: Tag[];
}

export default function SignDataItem() {
  // connect params
  const params = useAuthParams<{
    appData: { appURL: string };
    data: DataStructure;
  }>();

  const [password, setPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenName, setTokenName] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [amount, setAmount] = useState<Quantity | null>(null);
  const { setToast } = useToasts();
  const ao = useAo();

  const recipient =
    params?.data?.tags.find((tag) => tag.name === "Recipient")?.value || "NA";
  const quantity =
    params?.data?.tags.find((tag) => tag.name === "Quantity")?.value || "NA";
  const process = params?.data?.target;

  const [signatureAllowance] = useStorage(
    {
      key: "signatureAllowance",
      instance: ExtensionStorage
    },
    10
  );

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signDataItem", params?.authID);

  const passwordInput = useInput();

  const svgieAvatar = useMemo(
    () => svgie(recipient, { asDataURI: true }),
    [recipient]
  );

  useEffect(() => {
    if (signatureAllowance < amount?.toNumber()) {
      setPassword(true);
    } else {
      setPassword(false);
    }
  }, [signatureAllowance, amount]);

  // get ao token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        if (process) {
          setLoading(true);
          const token = await Token(params.data.target, null, ao);
          const logo = await getUserAvatar(token?.info?.Logo || "");

          const tokenAmount = new Quantity(
            BigInt(quantity),
            token.info.Denomination
          );
          setTokenName(token.info.Name);
          setLogo(logo);
          setAmount(tokenAmount);
          setLoading(false);
        }
      } catch (err) {
        console.log("err", err);
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [params]);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (password) return;
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [params?.authID, password]);

  // sign message
  async function sign() {
    if (password) {
      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400
        });
        return;
      }
    }

    // send response
    await replyToAuthRequest("signDataItem", params?.authID);

    // close the window
    closeWindow();
  }

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={browser.i18n.getMessage("sign_item")}
          showOptions={false}
          back={cancel}
        />
        <Description>
          <Text noMargin>
            {browser.i18n.getMessage(
              "sign_data_description",
              params?.appData.appURL
            )}
          </Text>
          <div>
            <ListItem
              small
              description={formatAddress(recipient, 10)}
              title={"Recipient"}
              img={svgieAvatar}
              onClick={() =>
                browser.tabs.create({
                  url: `https://viewblock.io/arweave/address/${recipient}`
                })
              }
            />
            {loading ? (
              <Loading />
            ) : (
              <ListItem
                img={logo}
                small
                title={tokenName}
                description={amount?.toLocaleString()}
                onClick={() =>
                  browser.tabs.create({
                    url: `https://ao_marton.g8way.io/#/process/${process}`
                  })
                }
              />
            )}
          </div>
        </Description>
        <Spacer y={0.75} />
      </div>
      <Section>
        <Spacer y={1.25} />
        {password && (
          <>
            <PasswordWrapper>
              <InputV2
                placeholder="Enter your password"
                small
                {...passwordInput.bindings}
                label={"Password"}
                type="password"
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  await sign();
                }}
                fullWidth
              />
            </PasswordWrapper>
            <Spacer y={1} />
          </>
        )}
        <ButtonV2
          fullWidth
          onClick={sign}
          disabled={(password && !passwordInput.state) || loading}
        >
          {browser.i18n.getMessage("signature_authorize")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const Description = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const PasswordWrapper = styled.div`
  display: flex;
  padding-top: 16px;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
