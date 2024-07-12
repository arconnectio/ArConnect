import {
  ButtonV2,
  Card,
  Checkbox,
  InputV2,
  LabelV2,
  Section,
  Spacer,
  Text,
  TooltipV2,
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
import App from "~components/auth/App";
import styled from "styled-components";
import { EventType, trackEvent } from "~utils/analytics";
import Application from "~applications/application";
import { defaultGateway, type Gateway } from "~gateways/gateway";
import HeadV2 from "~components/popup/HeadV2";
import { CheckIcon, CloseIcon } from "@iconicicons/react";
import {
  InfoCircle,
  ToggleSwitch
} from "~routes/popup/subscriptions/subscriptionDetails";
import { defaultAllowance } from "~applications/allowance";
import Arweave from "arweave";
import Permissions from "../../components/auth/Permissions";
import { Flex } from "~routes/popup/settings/apps/[url]";

export default function Connect() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const arweave = new Arweave(defaultGateway);

  // wallet switcher open
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // page
  const [page, setPage] = useState<"unlock" | "permissions">("unlock");

  const allowanceInput = useInput();

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

  // allowance for permissions
  const [allowanceEnabled, setAllowanceEnabled] = useState(true);

  // state management for edit
  const [edit, setEdit] = useState(false);

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
      setRequetedPermCopy(
        requested.filter((p) => Object.keys(permissionData).includes(p))
      );
    })();
  }, [params]);

  const [requestedPermCopy, setRequetedPermCopy] = useState<PermissionType[]>(
    []
  );

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
  async function connect(alwaysAsk: boolean = false) {
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
        allowance: {
          enabled: alwaysAsk ? false : allowanceEnabled,
          limit:
            allowanceEnabled && allowanceInput.state
              ? arweave.ar.arToWinston(allowanceInput.state)
              : defaultAllowance.limit,
          spent: "0" // in winstons
        },
        // TODO: wayfinder
        gateway: params.gateway || defaultGateway
      });
    } else {
      // update existing permissions, if the app
      // has already been added

      const allowance = await app.getAllowance();
      await app.updateSettings({
        permissions,
        allowance: {
          // Always preserve the current spent amount
          spent: allowance.spent.toString(),

          // Determine the new limit:
          limit: alwaysAsk
            ? allowance.limit.toString() // If 'Always Ask' is enabled, keep the existing limit
            : allowanceEnabled && allowanceInput.state
            ? arweave.ar.arToWinston(allowanceInput.state) // If allowance is enabled and a new limit is set, use the new limit
            : defaultAllowance.limit, // Otherwise, use the default limit

          // If 'Always Ask' is true, disable allowance
          // Otherwise, use the current allowance enabled state
          enabled: alwaysAsk ? false : allowanceEnabled
        }
      });
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

  useEffect(() => {
    allowanceInput.setState(arweave.ar.winstonToAr(defaultAllowance.limit));
  }, []);

  const removedPermissions = useMemo(() => {
    return requestedPermCopy.filter(
      (permission) => !requestedPermissions.includes(permission)
    );
  }, [requestedPermCopy, requestedPermissions]);

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={!edit ? browser.i18n.getMessage("sign_in") : "Permissions"}
          showOptions={false}
          back={edit ? () => setEdit(false) : cancel}
        />
        <App
          appName={appData.name || appUrl}
          appUrl={appUrl}
          showTitle={false}
          // TODO: wayfinder
          gateway={params?.gateway || defaultGateway}
          appIcon={appData.logo}
        />

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
              <>
                {!edit ? (
                  <PermissionsContent>
                    <Section>
                      <Description>
                        {browser.i18n.getMessage(
                          "allow_these_permissions",
                          appData.name || appUrl
                        )}
                      </Description>
                      <Url>{params.url}</Url>
                      <StyledPermissions>
                        <PermissionsTitle>
                          <Description>
                            {browser.i18n.getMessage("app_permissions")}
                          </Description>
                          <Description
                            alt
                            onClick={() => {
                              setEdit(!edit);
                            }}
                          >
                            {browser.i18n.getMessage("edit_permissions")}
                          </Description>
                        </PermissionsTitle>
                      </StyledPermissions>
                      {requestedPermissions.map((permission, i) => (
                        <Permission key={i}>
                          <StyledCheckIcon />
                          <PermissionItem>
                            {browser.i18n.getMessage(
                              permissionData[permission.toUpperCase()]
                            )}
                          </PermissionItem>
                        </Permission>
                      ))}
                      {requestedPermCopy
                        .filter(
                          (permission) =>
                            !requestedPermissions.includes(permission)
                        )
                        .map((permission, i) => (
                          <Permission key={i}>
                            <StyledCloseIcon />
                            <PermissionItem>
                              {browser.i18n.getMessage(
                                permissionData[permission.toUpperCase()]
                              )}
                            </PermissionItem>
                          </Permission>
                        ))}

                      <AllowanceSection>
                        <Flex
                          alignItems="center"
                          justifyContent="space-between"
                          style={{ gap: "4px" }}
                        >
                          <div>{browser.i18n.getMessage("allowance")}</div>
                          <TooltipV2 content={InfoText} position="bottom">
                            <InfoCircle />
                          </TooltipV2>
                        </Flex>

                        <ToggleSwitch
                          checked={allowanceEnabled}
                          setChecked={setAllowanceEnabled}
                        />
                      </AllowanceSection>
                      {allowanceEnabled && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <AllowanceInput
                            label={browser.i18n.getMessage("limit")}
                            fullWidth
                            small
                            icon={<>AR</>}
                            type="number"
                            {...allowanceInput.bindings}
                          />
                        </motion.div>
                      )}
                    </Section>
                  </PermissionsContent>
                ) : (
                  <>
                    <Permissions
                      requestedPermissions={requestedPermissions}
                      update={setRequestedPermissions}
                      closeEdit={setEdit}
                    />
                  </>
                )}
              </>
            )}
          </AnimatePresence>
        </ContentWrapper>
      </div>
      {!edit && (
        <Section>
          <>
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
              {browser.i18n.getMessage(
                page === "unlock"
                  ? "sign_in"
                  : removedPermissions.length > 0
                  ? "allow_selected_permissions"
                  : "always_allow"
              )}
            </ButtonV2>
            <Spacer y={0.75} />
            <ButtonV2
              fullWidth
              secondary
              onClick={page === "unlock" ? cancel : () => connect(true)}
            >
              {browser.i18n.getMessage(
                page === "unlock" ? "cancel" : "always_ask_permission"
              )}
            </ButtonV2>
          </>
        </Section>
      )}
    </Wrapper>
  );
}

const InfoText: React.ReactNode = (
  <div style={{ fontSize: "10px", lineHeight: "14px", textAlign: "center" }}>
    Set the amount you want <br />
    ArConnect to automatically transfer
  </div>
);

const WalletSelectWrapper = styled.div`
  position: relative;
`;

const StyledPermissions = styled.div`
  padding-bottom: 1rem;
`;

const Permission = styled.div`
  margin: 0;
  align-items: center;
  display: flex;
  gap: 8px;
`;

const PermissionsTitle = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const SelectIcon = styled(ChevronDownIcon)`
  font-size: 1rem;
  width: 1.375rem;
  height: 1.375 rem;
  color: ${(props) => props.theme.primaryTextv2};
  transition: all 0.23s ease-in-out;
`;

const Description = styled(Text)<{ alt?: boolean }>`
  color: ${(props) =>
    props.alt ? `rgb(${props.theme.theme})` : props.theme.primaryTextv2};
  margin-bottom: 4px;
  ${(props) =>
    props.alt &&
    `
    cursor: pointer;
  `}
`;
const Url = styled(Text)`
  color: ${(props) => props.theme.secondaryTextv2};
  font-size: 12px;
`;

const StyledCheckIcon = styled(CheckIcon)`
  width: 17px;
  height: 17px;
  min-width: 17px;
  min-height: 17px;
  flex-shrink: 0;
  color: rgba(20, 209, 16, 1);
`;

const StyledCloseIcon = styled(CloseIcon)`
  width: 17px;
  height: 17px;
  min-width: 17px;
  min-height: 17px;
  flex-shrink: 0;
  color: ${(props) => props.theme.fail};
`;

const AllowanceInput = styled(InputV2)`
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const PermissionItem = styled(Text)`
  color: ${(props) => props.theme.primaryTextv2};
  margin: 0;
  font-size: 14px;
`;

const AllowanceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 18px;
  div {
    color: ${(props) => props.theme.primaryTextv2};
    font-size: 18px;
    font-weight: 00;
  }
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
