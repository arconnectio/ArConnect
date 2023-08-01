import {
  Button,
  Card,
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import { permissionData, type PermissionType } from "~applications/permissions";
import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { defaultGateway, type Gateway } from "~applications/gateway";
import { CloseLayer } from "~components/popup/WalletHeader";
import type { AppInfo } from "~applications/application";
import { AnimatePresence, motion } from "framer-motion";
import { unlock as globalUnlock } from "~wallets/auth";
import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import PermissionCheckbox, {
  PermissionDescription
} from "~components/auth/PermissionCheckbox";
import { addApp } from "~applications";
import WalletSwitcher from "~components/popup/WalletSwitcher";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Label from "~components/auth/Label";
import Head from "~components/popup/Head";
import App from "~components/auth/App";
import styled from "styled-components";
import { trackEvent } from "~utils/analytics";

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
  const requestedPermissions = useMemo<PermissionType[]>(() => {
    if (!params) return [];

    const requested: string[] = params.permissions;

    return requested.filter((p) =>
      Object.keys(permissionData).includes(p)
    ) as PermissionType[];
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

    // add the app
    await addApp({
      url: appUrl,
      permissions,
      name: appData.name,
      logo: appData.logo,
      gateway: params.gateway || defaultGateway
    });

    // send response
    await replyToAuthRequest("connect", params.authID);

    // track connected app.
    await trackEvent("connected app", { appName: appData.name });

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
          gateway={params?.gateway || defaultGateway}
          appIcon={appData.logo}
        />
        <Spacer y={1.5} />
        <ContentWrapper>
          <AnimatePresence initial={false}>
            {page === "unlock" && (
              <UnlockWrapper>
                <Section>
                  <Label>{browser.i18n.getMessage("wallet")}</Label>
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
                  <Input
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
                      <PermissionCheckbox
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
                        {permission.toUpperCase()}
                        <br />
                        <PermissionDescription>
                          {browser.i18n.getMessage(
                            permissionData[permission.toUpperCase()]
                          )}
                        </PermissionDescription>
                      </PermissionCheckbox>
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
        <Button
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
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}

const WalletSelectWrapper = styled.div`
  position: relative;
`;

const SelectIcon = styled(ChevronDownIcon)`
  font-size: 1.25rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.theme});
  transition: all 0.23s ease-in-out;
`;

const WalletSelect = styled(Card)<{ open: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background-color: transparent;
  padding: 0.75rem 1.25rem;
  border-radius: 18px;
  transition: all 0.23s ease-in-out;

  ${(props) =>
    props.open
      ? `border-color: rgba(${props.theme.theme}, .5); box-shadow: 0 0 0 1px rgba(${props.theme.theme}, .5);`
      : ""}

  ${SelectIcon} {
    transform: ${(props) => (props.open ? "rotate(180deg)" : "rotate(0)")};
  }
`;

const Address = styled(Text).attrs({
  noMargin: true
})`
  font-size: 1.2rem;
  color: rgb(${(props) => props.theme.theme});
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
