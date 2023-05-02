import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import { Gateway } from "~applications/gateway";
import type { StoredWallet } from "~wallets";
import { getAppURL } from "~utils/format";
import { removeApp } from "~applications";
import { useAnsProfile } from "~lib/ans";
import { useTheme } from "~utils/theme";
import {
  Button,
  Card,
  DisplayTheme,
  Section,
  Text,
  Tooltip,
  useToasts
} from "@arconnect/components";
import {
  BoxIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  GridIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon
} from "@iconicicons/react";
import WalletSwitcher, { popoverAnimation } from "./WalletSwitcher";
import Application, { AppInfo } from "~applications/application";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import useActiveTab from "~applications/useActiveTab";
import AppIcon, { NoAppIcon } from "./home/AppIcon";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";

export default function WalletHeader() {
  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // is the wallet selector open
  const [isOpen, setOpen] = useState(false);

  // toasts
  const { setToast } = useToasts();

  // copy current address
  const copyAddress: MouseEventHandler = (e) => {
    e.stopPropagation();
    copy(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    setToast({
      type: "success",
      duration: 2000,
      content: browser.i18n.getMessage("copied_address")
    });
  };

  // profile picture
  const ansProfile = useAnsProfile(activeAddress);

  // wallet name
  const walletName = useMemo(() => {
    if (!ansProfile?.label) {
      const wallet = wallets.find(({ address }) => address === activeAddress);

      return wallet?.nickname || "Wallet";
    }

    return ansProfile.label;
  }, [wallets, ansProfile, activeAddress]);

  // hardware wallet type
  const hardwareApi = useHardwareApi();

  // ui theme
  const theme = useTheme();

  // scroll position
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const listener = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", listener);

    return () => window.removeEventListener("scroll", listener);
  }, []);

  // app info open
  const [appDataOpen, setAppDataOpen] = useState(false);

  // active app
  const activeTab = useActiveTab();
  const activeApp = useMemo<Application | undefined>(() => {
    if (!activeTab?.url) {
      return undefined;
    }

    return new Application(getAppURL(activeTab.url));
  }, [activeTab]);

  // active app data
  const [activeAppData, setActiveAppData] = useState<
    AppInfo & { gateway: Gateway }
  >();

  useEffect(() => {
    (async () => {
      // check if there is an active app
      if (!activeApp) {
        return setActiveAppData(undefined);
      }

      // check if connected
      const connected = await activeApp.isConnected();
      if (!connected) {
        return setActiveAppData(undefined);
      }

      // get app data
      const appData = await activeApp.getAppData();
      const gatewayConfig = await activeApp.getGatewayConfig();

      setActiveAppData({
        ...appData,
        gateway: gatewayConfig
      });
    })();
  }, [activeApp]);

  // copied address
  const [copied, setCopied] = useState(false);

  return (
    <Wrapper
      onClick={() => {
        if (!isOpen) setOpen(true);
      }}
      displayTheme={theme}
      scrolled={scrollY > 14}
    >
      <Wallet>
        <Avatar img={ansProfile?.avatar}>
          {!ansProfile?.avatar && <NoAvatarIcon />}
          <AnimatePresence initial={false}>
            {hardwareApi === "keystone" && (
              <HardwareWalletIcon
                icon={keystoneLogo}
                color="#2161FF"
                {...hwIconAnimateProps}
              />
            )}
          </AnimatePresence>
        </Avatar>
        <WithArrow>
          <Text noMargin>{walletName}</Text>
          <ExpandArrow open={isOpen} />
        </WithArrow>
      </Wallet>
      <WalletActions>
        <Tooltip content="Viewblock" position="bottom">
          <Action
            as={BoxIcon}
            onClick={() =>
              browser.tabs.create({
                url: `https://viewblock.io/arweave/address/${activeAddress}`
              })
            }
          />
        </Tooltip>
        <Tooltip
          content={browser.i18n.getMessage("copy_address")}
          position="bottom"
        >
          <Action as={copied ? CheckIcon : CopyIcon} onClick={copyAddress} />
        </Tooltip>
        <AppAction
          onClick={(e) => {
            e.stopPropagation();
            setAppDataOpen(true);
          }}
        >
          <Action as={GridIcon} />
          {activeAppData && <AppOnline />}
        </AppAction>
        <AnimatePresence>
          {appDataOpen && (
            <AppInfoWrapper
              variants={popoverAnimation}
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <AppInfo>
                  {(!!activeAppData && (
                    <Tooltip
                      content={
                        browser.i18n.getMessage("gateway") +
                        ": " +
                        activeAppData.gateway.host
                      }
                      position="topStart"
                    >
                      <ActiveAppIcon connected>
                        {(activeAppData?.logo && (
                          <img
                            src={activeAppData.logo}
                            alt={activeAppData.name || ""}
                            draggable={false}
                          />
                        )) || <NoAppIcon />}
                        {activeAppData && <AppOnline />}
                      </ActiveAppIcon>
                    </Tooltip>
                  )) || (
                    <ActiveAppIcon connected={false}>
                      <NoAppIcon />
                    </ActiveAppIcon>
                  )}
                  <div>
                    <AppName>
                      {activeAppData?.name ||
                        browser.i18n.getMessage(
                          activeAppData ? "appConnected" : "not_connected"
                        )}
                    </AppName>
                    <AppUrl>{getAppURL(activeTab.url)}</AppUrl>
                  </div>
                </AppInfo>
                <AppOptions>
                  {(!activeAppData && (
                    <NotConnectedNote>
                      {browser.i18n.getMessage("not_connected_text")}
                    </NotConnectedNote>
                  )) || (
                    <>
                      <AppActionButtons>
                        <Button
                          small
                          fullWidth
                          secondary
                          onClick={() =>
                            browser.tabs.create({
                              url: browser.runtime.getURL(
                                `tabs/dashboard.html#/apps/${activeApp.url}`
                              )
                            })
                          }
                        >
                          <SettingsIcon />
                          {browser.i18n.getMessage("settings")}
                        </Button>
                        <Button
                          small
                          fullWidth
                          onClick={async () => {
                            await removeApp(getAppURL(activeTab.url));
                            setActiveAppData(undefined);
                            setAppDataOpen(false);
                          }}
                        >
                          <LogOutIcon />
                          {browser.i18n.getMessage("disconnect")}
                        </Button>
                      </AppActionButtons>
                    </>
                  )}
                </AppOptions>
              </Card>
            </AppInfoWrapper>
          )}
        </AnimatePresence>
      </WalletActions>
      {(isOpen || appDataOpen) && (
        <CloseLayer
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            setAppDataOpen(false);
          }}
        />
      )}
      <WalletSwitcher open={isOpen} close={() => setOpen(false)} />
    </Wrapper>
  );
}

const Wrapper = styled(Section)<{
  displayTheme: DisplayTheme;
  scrolled: boolean;
}>`
  position: sticky;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 2.2rem;
  padding-bottom: 1.5rem;
  cursor: pointer;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(${(props) => props.theme.background}, 0.75);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid;
  border-bottom-color: ${(props) =>
    props.scrolled
      ? "rgba(" +
        (props.displayTheme === "light" ? "235, 235, 241" : "31, 30, 47") +
        ")"
      : "transparent"};
  transition: all 0.23s ease-in-out;
`;

const Wallet = styled.div`
  display: flex;
  align-items: center;
  gap: 0.64rem;

  p {
    color: rgb(${(props) => props.theme.primaryText});
  }

  ${HardwareWalletIcon} {
    width: 16px;
    height: 16px;
  }
`;

export const Avatar = styled(Squircle)`
  position: relative;
  width: 1.425rem;
  height: 1.425rem;
  transition: all 0.07s ease-in-out;

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }

  &:active {
    transform: scale(0.93);
  }
`;

export const NoAvatarIcon = styled(UserIcon)`
  position: absolute;
  font-size: 1rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const WithArrow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.1rem;
`;

const ExpandArrow = styled(ChevronDownIcon)<{ open: boolean }>`
  color: rgb(${(props) => props.theme.primaryText});
  font-size: 1.2rem;
  width: 1em;
  height: 1em;
  transition: all 0.23s ease-in-out;

  transform: ${(props) => (props.open ? "rotate(180deg)" : "rotate(0)")};
`;

const AppAction = styled.div`
  position: relative;
  display: flex;
`;

const AppOnline = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: #00e600;
  border: 1px solid rgb(${(props) => props.theme.background});
`;

const Action = styled(CopyIcon)`
  font-size: 1.25rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const WalletActions = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.34rem;
`;

const AppInfoWrapper = styled(motion.div).attrs({
  initial: "closed",
  animate: "open",
  exit: "closed"
})`
  position: absolute;
  top: 150%;
  right: 0;
  z-index: 110;
  width: calc(100vw - 2 * 20px);
  cursor: default;

  ${Card} {
    padding: 0;
    width: 100%;
  }
`;

const AppInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  gap: 10px;
  border-bottom: 1px solid rgb(${(props) => props.theme.cardBorder});
`;

const AppOptions = styled.div`
  padding: 10px;
`;

const AppActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 0.6rem;
`;

const NotConnectedNote = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.84rem;
  text-align: justify;
`;

const ActiveAppIcon = styled(AppIcon)<{ connected: boolean }>`
  position: relative;
  width: 2rem;
  height: 2rem;
  color: rgb(
    ${(props) =>
      props.connected ? props.theme.theme : props.theme.secondaryText}
  );

  ${AppOnline} {
    width: 10px;
    height: 10px;
    border-width: 1.5px;
    right: -2.5px;
    bottom: -2.5px;
  }

  ${NoAppIcon} {
    font-size: 1rem;
  }

  img {
    max-width: 1.5em;
  }
`;

const AppName = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.primaryText});
  line-height: 1.1em;
`;

const AppUrl = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.75rem;
  line-height: 1.1em;
`;

export const CloseLayer = styled.div`
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  cursor: default;
`;
