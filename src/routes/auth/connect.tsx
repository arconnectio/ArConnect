import {
  ButtonV2,
  Card,
  Checkbox,
  InputV2,
  LabelV2,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import { permissionData, type PermissionType } from "~applications/permissions";
import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { CloseLayer } from "~components/popup/WalletHeader";
import type { AppInfo } from "~applications/application";
import { AnimatePresence, motion } from "framer-motion";
import { unlock as globalUnlock } from "~wallets/auth";
import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import { addApp } from "~applications";
import WalletSwitcher from "~components/popup/WalletSwitcher";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Label from "~components/auth/Label";
import Head from "~components/popup/Head";
import App from "~components/auth/App";
import styled from "styled-components";
import { EventType, trackEvent } from "~utils/analytics";
import Application from "~applications/application";
import { defaultGateway, Gateway } from "~gateways/gateway";

export default function Connect() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // wallet switcher open
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // page
  const [page, setPage] = useState<"unlock" | "permissions">("unlock");

  // connect params
  const params = useAuthParams<{
    url: string;
    permissions: PermissionType[];
    appInfo: AppInfo;
    gateway?: Gateway;
  }>();

  // app data
  const appData = useMemo<AppInfo>(() => {
    if (!params) return {};

    return params.appInfo;
  }, [params]);

  // app url
  const appUrl = useMemo(() => {
    if (!params) return "";

    return params.url;
  }, [params]);

  // requested permissions
  const [requestedPermissions, setRequestedPermissions] = useState<
    PermissionType[]
  >([]);

  useEffect(() => {
    (async () => {
      if (!params) return;

      const requested: PermissionType[] = params.permissions;

      // add existing permissions
      if (params.url && params.url !== "") {
        const app = new Application(params.url);
        const existing = await app.getPermissions();

        for (const existingP of existing) {
          if (requested.includes(existingP)) continue;
          requested.push(existingP);
        }
      }

      setRequestedPermissions(
        requested.filter((p) => Object.keys(permissionData).includes(p))
      );
    })();
  }, [params]);

  // permissions to add
  const [permissions, setPermissions] = useState<PermissionType[]>([]);

  useEffect(() => setPermissions(requestedPermissions), [requestedPermissions]);

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("connect", params?.authID);

  // unlock
  async function unlock() {
    const unlockRes = await globalUnlock(passwordInput.state);

    if (!unlockRes) {
      passwordInput.setStatus("error");
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }

    setPage("permissions");

    // listen for enter to connect
    window.addEventListener("keydown", async (e) => {
      if (e.key !== "Enter") return;
      await connect();
    });
  }

  // connect
  async function connect() {
    if (appUrl === "") return;

    // get existing permissions
    const app = new Application(appUrl);
    const existingPermissions = await app.getPermissions();

    if (existingPermissions.length === 0) {
      // add the app
      await addApp({
        url: appUrl,
        permissions,
        name: appData.name,
        logo: appData.logo,
        // TODO: wayfinder
        gateway: params.gateway || defaultGateway
      });
    } else {
      // update existing permissions, if the app
      // has already been added
      await app.updateSettings({ permissions });
    }

    // send response
    await replyToAuthRequest("connect", params.authID);

    // track connected app.
    await trackEvent(EventType.CONNECTED_APP, {
      appName: appData.name,
      appUrl
    });

    // close the window
    closeWindow();
  }

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("sign_in")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <App
          appName={appData.name || appUrl}
          appUrl={appUrl}
          // TODO: wayfinder
          gateway={params?.gateway || defaultGateway}
          appIcon={appData.logo}
        />
        <Spacer y={1.5} />
        <ContentWrapper>
          <AnimatePresence initial={false}>
            {page === "unlock" && (
              <UnlockWrapper>
                <Section>
                  <LabelV2>{browser.i18n.getMessage("wallet")}</LabelV2>
                  <Spacer y={0.4} />
                  <WalletSelectWrapper>
                    <WalletSelect
                      onClick={() => setSwitcherOpen(true)}
                      open={switcherOpen}
                    >
                      <Address>
                        {formatAddress(activeAddress || "", 10)}
                      </Address>
                      <SelectIcon />
                    </WalletSelect>
                    {switcherOpen && (
                      <CloseLayer onClick={() => setSwitcherOpen(false)} />
                    )}
                    <WalletSwitcher
                      open={switcherOpen}
                      close={() => setSwitcherOpen(false)}
                      showOptions={false}
                      exactTop={true}
                      noPadding={true}
                    />
                  </WalletSelectWrapper>
                  <Spacer y={1} />
                  <InputV2
                    type="password"
                    placeholder={browser.i18n.getMessage("enter_your_password")}
                    label={browser.i18n.getMessage("password")}
                    fullWidth
                    {...passwordInput.bindings}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      unlock();
                    }}
                  />
                </Section>
              </UnlockWrapper>
            )}
            {page === "permissions" && (
              <PermissionsContent>
                <Section>
                  <Text>
                    {browser.i18n.getMessage("allow_these_permissions")}
                  </Text>
                  {requestedPermissions.map((permission, i) => (
                    <div key={i}>
                      <Checkbox
                        checked={permissions.includes(permission)}
                        onChange={(checked) =>
                          setPermissions((val) => {
                            if (checked && val.includes(permission)) return val;
                            if (!checked && !val.includes(permission))
                              return val;
                            if (checked && !val.includes(permission)) {
                              return [...val, permission];
                            }
                            if (!checked && val.includes(permission)) {
                              return val.filter((p) => p !== permission);
                            }
                          })
                        }
                      >
                        {browser.i18n.getMessage(
                          permissionData[permission.toUpperCase()]
                        )}
                      </Checkbox>
                      {i !== requestedPermissions.length - 1 && (
                        <Spacer y={0.8} />
                      )}
                    </div>
                  ))}
                </Section>
              </PermissionsContent>
            )}
          </AnimatePresence>
        </ContentWrapper>
      </div>
      <Section>
        <ButtonV2
          fullWidth
          onClick={async () => {
            if (page === "unlock") {
              await unlock();
            } else {
              await connect();
            }
          }}
        >
          {browser.i18n.getMessage(page === "unlock" ? "sign_in" : "connect")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const WalletSelectWrapper = styled.div`
  position: relative;
`;

const SelectIcon = styled(ChevronDownIcon)`
  font-size: 1rem;
  width: 1.375rem;
  height: 1.375 rem;
  color: ${(props) => props.theme.primaryTextv2};
  transition: all 0.23s ease-in-out;
`;

const WalletSelect = styled(Card)<{ open: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background-color: transparent;
  padding: 0.844rem 0.9375rem;
  border: 1.5px solid ${(props) => props.theme.inputField};
  border-radius: 10px;
  transition: all 0.23s ease-in-out;

  ${SelectIcon} {
    transform: ${(props) => (props.open ? "rotate(180deg)" : "rotate(0)")};
  }

  &:focus-within,
  &: hover {
    ${(props) => "border: 1.5px solid " + props.theme.primaryTextv2};
  }

  &:active {
    border-color: ${(props) => props.theme.inputField};
    color: rgb(${(props) => props.theme.theme});
  }
`;

const Address = styled(Text).attrs({
  noMargin: true,
  title: false
})`
  font-size: 16px;
  line-height: 22px;
  font-weight: 500;
  color: ${(props) => props.theme.primaryTextv2};
`;

const ContentWrapper = styled.div`
  display: flex;
  width: max-content;
`;

const UnlockWrapper = styled(motion.div).attrs({
  exit: { opacity: 0 },
  transition: {
    type: "easeInOut",
    duration: 0.2
  }
})`
  width: 100vw;

  ${Label} {
    font-weight: 500;
  }
`;

const PermissionsContent = styled(motion.div).attrs({
  initial: {
    opacity: 0,
    y: 50
  },
  animate: {
    opacity: 1,
    y: 0
  },
  transition: {
    type: "easeInOut",
    duration: 0.2
  }
})`
  width: 100vw;
`;
