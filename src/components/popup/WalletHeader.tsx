import { defaultGateway, concatGatewayURL } from "~applications/gateway";
import {
  HTMLProps,
  MouseEventHandler,
  useEffect,
  useMemo,
  useState
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStorage } from "@plasmohq/storage/hook";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import type { StoredWallet } from "~wallets";
import { getAppURL } from "~utils/format";
import { removeApp } from "~applications";
import type { AnsUser } from "~lib/ans";
import { useTheme } from "~utils/theme";
import {
  Button,
  Card,
  DisplayTheme,
  Section,
  Text,
  useToasts
} from "@arconnect/components";
import {
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
    area: "local",
    isSecret: true
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
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

  // fetch ANS name (cached in storage)
  const [ans] = useStorage<AnsUser>({
    key: "ans_data",
    area: "local",
    isSecret: true
  });

  // wallet name
  const walletName = useMemo(() => {
    if (!ans?.currentLabel) {
      const wallet = wallets.find(({ address }) => address === activeAddress);

      return wallet?.nickname || "Wallet";
    }

    return ans.currentLabel + ".ar";
  }, [wallets, ans, activeAddress]);

  // profile picture
  const [avatar, setAvatar] = useState<{
    for: string;
    img: string;
  }>();

  useEffect(() => {
    if (ans?.user === avatar?.for) return;
    if (!ans?.avatar || !!avatar) return;

    setAvatar({
      for: ans.user,
      img: concatGatewayURL(defaultGateway) + "/" + ans.avatar
    });
  }, [ans]);

  useEffect(() => setAvatar(undefined), [activeAddress]);

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
  const [activeAppData, setActiveAppData] = useState<AppInfo>();

  useEffect(() => {
    (async () => {
      if (!activeApp) {
        return setActiveAppData(undefined);
      }

      const connected = await activeApp.isConnected();
      if (!connected) {
        return setActiveAppData(undefined);
      }

      setActiveAppData(await activeApp.getAppData());
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
        <Avatar img={avatar?.img}>
          {!avatar?.img && <NoAvatarIcon />}
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
        <Action
          // @ts-expect-error
          as={ViewblockIcon}
          onClick={() =>
            browser.tabs.create({
              url: `https://viewblock.io/arweave/address/${activeAddress}`
            })
          }
        />
        <Action as={copied ? CheckIcon : CopyIcon} onClick={copyAddress} />
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
                  <ActiveAppIcon connected={!!activeAppData}>
                    {(activeAppData?.logo && (
                      <img
                        src={activeAppData.logo}
                        alt={activeAppData.name || ""}
                        draggable={false}
                      />
                    )) || <NoAppIcon />}
                    {activeAppData && <AppOnline />}
                  </ActiveAppIcon>
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

const ViewblockIcon = (props: HTMLProps<HTMLOrSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...(props as any)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.5337 11.3662L5.1543 7.68313L11.5337 3.99985L17.913 7.68313L11.5337 11.3662ZM11.367 10.7722C11.367 10.8644 11.4416 10.9345 11.5335 10.9345C11.6254 10.9345 11.7 10.8561 11.7 10.764C11.7 10.6721 11.6254 10.5978 11.5335 10.5978C11.4416 10.5978 11.367 10.6721 11.367 10.764V10.7722ZM11.5337 5.65043C11.4417 5.65043 11.367 5.57604 11.367 5.48363V5.46664C11.367 5.37443 11.4417 5.29984 11.5337 5.29984C11.6258 5.29984 11.7005 5.37443 11.7005 5.46664V5.48363C11.7005 5.57604 11.6258 5.65043 11.5337 5.65043ZM11.5337 6.53311C11.4417 6.53311 11.367 6.45874 11.367 6.36633V6.34913C11.367 6.25713 11.4417 6.18254 11.5337 6.18254C11.6258 6.18254 11.7005 6.25713 11.7005 6.34913V6.36633C11.7005 6.45874 11.6258 6.53311 11.5337 6.53311ZM11.5337 7.41599C11.4417 7.41599 11.367 7.34154 11.367 7.24927V7.23186C11.367 7.13974 11.4417 7.06538 11.5337 7.06538C11.6258 7.06538 11.7005 7.13974 11.7005 7.23186V7.24927C11.7005 7.34154 11.6258 7.41599 11.5337 7.41599ZM11.5337 8.29864C11.4417 8.29864 11.367 8.22417 11.367 8.1319V8.11466C11.367 8.02264 11.4417 7.94793 11.5337 7.94793C11.6258 7.94793 11.7005 8.02264 11.7005 8.11466V8.1319C11.7005 8.22417 11.6258 8.29864 11.5337 8.29864ZM11.5337 9.18152C11.4417 9.18152 11.367 9.10707 11.367 9.01481V8.9974C11.367 8.90528 11.4417 8.83083 11.5337 8.83083C11.6258 8.83083 11.7005 8.90528 11.7005 8.9974V9.01481C11.7005 9.10707 11.6258 9.18152 11.5337 9.18152ZM11.5337 10.0641C11.4417 10.0641 11.367 9.98962 11.367 9.89736V9.8802C11.367 9.78818 11.4417 9.71363 11.5337 9.71363C11.6258 9.71363 11.7005 9.78818 11.7005 9.8802V9.89736C11.7005 9.98962 11.6258 10.0641 11.5337 10.0641ZM11.367 4.60135C11.367 4.69322 11.4416 4.76356 11.5335 4.76356C11.6254 4.76356 11.7 4.68494 11.7 4.59308C11.7 4.50101 11.6254 4.42653 11.5335 4.42653C11.4416 4.42653 11.367 4.50101 11.367 4.59308V4.60135Z"
      fill="white"
      fillOpacity="0.6"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.3792 19L5 15.3171V7.95056L11.3792 11.6336V19ZM10.7129 12.0174C10.7434 12.0714 10.7997 12.1016 10.8575 12.1016C10.8855 12.1016 10.9137 12.0946 10.9398 12.0799L10.9468 12.0757C11.0269 12.0303 11.0511 11.9307 11.0056 11.8509C10.9606 11.7711 10.8551 11.7446 10.7753 11.7904C10.6953 11.8359 10.6674 11.9374 10.7129 12.0174ZM10.0933 12.5429C10.0358 12.5429 9.97952 12.513 9.94885 12.4596C9.90263 12.3796 9.93014 12.2778 10.0099 12.2319L10.0249 12.2232C10.1048 12.1773 10.2068 12.2048 10.2525 12.2846C10.2987 12.3642 10.2712 12.4662 10.1914 12.5119L10.1764 12.5207C10.1502 12.5358 10.1214 12.5429 10.0933 12.5429ZM9.32885 12.9845C9.27115 12.9845 9.21514 12.9545 9.18429 12.9009C9.13824 12.8211 9.16576 12.7191 9.24549 12.6732L9.26037 12.6647C9.34019 12.6186 9.44234 12.6461 9.48807 12.7258C9.53395 12.8056 9.50643 12.9076 9.4268 12.9535L9.41182 12.962C9.38567 12.9772 9.35693 12.9845 9.32885 12.9845ZM8.56431 13.4258C8.50732 13.4258 8.45163 13.3964 8.42046 13.3434C8.37392 13.2641 8.40038 13.1619 8.4797 13.1153L8.49468 13.1067C8.57384 13.0597 8.67624 13.0866 8.72278 13.166C8.76931 13.2453 8.74285 13.3475 8.66354 13.394L8.64856 13.4029C8.62216 13.4184 8.59302 13.4258 8.56431 13.4258ZM7.80007 13.8671C7.74236 13.8671 7.68619 13.8371 7.65534 13.7835C7.60944 13.7039 7.63698 13.6019 7.71669 13.5561L7.73167 13.5474C7.8114 13.5012 7.91337 13.5288 7.9591 13.6085C8.00524 13.6884 7.97773 13.7902 7.89799 13.8361L7.88303 13.8448C7.85672 13.8598 7.82815 13.8671 7.80007 13.8671ZM7.03534 14.3084C6.97796 14.3084 6.92162 14.2784 6.89096 14.2251C6.84498 14.1451 6.87225 14.0433 6.95223 13.9974L6.96719 13.9888C7.04717 13.9428 7.14866 13.9705 7.19464 14.05C7.24078 14.1297 7.21324 14.2317 7.13353 14.2775L7.11855 14.2861C7.09226 14.3014 7.06376 14.3084 7.03534 14.3084ZM6.27095 14.75C6.21339 14.75 6.15724 14.7201 6.12639 14.6664C6.08035 14.5867 6.10786 14.4847 6.18749 14.4389L6.20247 14.4302C6.28245 14.3839 6.38428 14.4117 6.43015 14.4913C6.47629 14.5713 6.44878 14.673 6.36905 14.719L6.35409 14.7277C6.32777 14.7426 6.29903 14.75 6.27095 14.75ZM5.36958 15.1038C5.40045 15.1572 5.45646 15.1871 5.51399 15.1871C5.54228 15.1871 5.57073 15.1798 5.59708 15.1647L5.60426 15.1606C5.68388 15.1145 5.70757 15.0148 5.66149 14.9353C5.61544 14.8557 5.51021 14.8305 5.4306 14.8763C5.3509 14.9224 5.32367 15.0242 5.36958 15.1038Z"
      fill="white"
      fillOpacity="0.8"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.6875 11.6336L18.0669 7.95056V15.3171L11.6875 19V11.6336ZM12.1274 12.0799C12.1533 12.0946 12.1816 12.1016 12.2094 12.1016C12.2672 12.1016 12.3237 12.0714 12.3541 12.0174C12.3998 11.9374 12.3717 11.8359 12.2919 11.7904L12.2846 11.7864C12.2044 11.741 12.1066 11.7709 12.0614 11.8509C12.0159 11.9307 12.0474 12.0345 12.1274 12.0799ZM12.974 12.5429C12.9458 12.5429 12.9172 12.5358 12.891 12.5207L12.8761 12.5119C12.7963 12.4662 12.7688 12.3642 12.8147 12.2846C12.8604 12.2048 12.9627 12.1773 13.0424 12.2232L13.0574 12.2319C13.1371 12.2778 13.1646 12.3796 13.1185 12.4596C13.0877 12.513 13.0317 12.5429 12.974 12.5429ZM13.7385 12.9845C13.7104 12.9845 13.6816 12.9772 13.6555 12.962L13.6405 12.9535C13.5608 12.9076 13.5333 12.8056 13.5793 12.7258C13.625 12.6461 13.7271 12.6186 13.8069 12.6647L13.8218 12.6732C13.9016 12.7191 13.9291 12.8211 13.883 12.9009C13.8522 12.9545 13.7961 12.9845 13.7385 12.9845ZM14.503 13.4258C14.4745 13.4258 14.4453 13.4184 14.4188 13.4029L14.4038 13.394C14.3245 13.3475 14.2979 13.2453 14.3445 13.166C14.3913 13.0866 14.493 13.0597 14.5726 13.1067L14.5875 13.1153C14.6669 13.1619 14.6933 13.2641 14.6468 13.3434C14.6159 13.3964 14.5602 13.4258 14.503 13.4258ZM15.2674 13.8671C15.2391 13.8671 15.2105 13.8598 15.1843 13.8448L15.1693 13.8361C15.0895 13.7902 15.062 13.6884 15.1082 13.6085C15.1541 13.5288 15.2559 13.5012 15.3356 13.5474L15.3506 13.5561C15.4305 13.6019 15.458 13.7039 15.4119 13.7835C15.3812 13.8371 15.3249 13.8671 15.2674 13.8671ZM16.0319 14.3084C16.0037 14.3084 15.9751 14.3014 15.9487 14.2861L15.9338 14.2775C15.8541 14.2317 15.8266 14.1297 15.8726 14.05C15.9186 13.9705 16.0203 13.9428 16.1003 13.9888L16.1153 13.9974C16.195 14.0433 16.2225 14.1451 16.1764 14.2251C16.1456 14.2784 16.0894 14.3084 16.0319 14.3084ZM16.7963 14.75C16.7683 14.75 16.7395 14.7426 16.7134 14.7277L16.6985 14.719C16.6187 14.673 16.5912 14.5713 16.6372 14.4913C16.6832 14.4117 16.7849 14.3839 16.8649 14.4302L16.8798 14.4389C16.9596 14.4847 16.9869 14.5867 16.9409 14.6664C16.91 14.7201 16.8541 14.75 16.7963 14.75ZM17.4684 15.1639C17.4951 15.1796 17.5241 15.1871 17.5528 15.1871C17.6097 15.1871 17.6652 15.1578 17.6964 15.1053C17.7432 15.0261 17.7169 14.924 17.6377 14.8773L17.6306 14.8731C17.5514 14.8264 17.4531 14.8546 17.4061 14.9337C17.3594 15.0129 17.3892 15.1172 17.4684 15.1639Z"
      fill="white"
    />
  </svg>
);
