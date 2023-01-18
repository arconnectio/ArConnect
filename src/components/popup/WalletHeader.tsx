import {
  DisplayTheme,
  Section,
  Text,
  Tooltip,
  useToasts
} from "@arconnect/components";
import {
  ChevronDownIcon,
  CopyIcon,
  GridIcon,
  UserIcon
} from "@iconicicons/react";
import { defaultGateway, concatGatewayURL } from "~applications/gateway";
import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import { AnimatePresence } from "framer-motion";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import type { AnsUser } from "~lib/ans";
import { useTheme } from "~utils/theme";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import WalletSwitcher from "./WalletSwitcher";
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
  const [avatar, setAvatar] = useState<string>();

  useEffect(() => {
    if (ans?.avatar === avatar) return;
    if (!ans?.avatar || !!avatar) return;

    setAvatar(concatGatewayURL(defaultGateway) + "/" + ans.avatar);
  }, [ans]);

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

  return (
    <Wrapper
      onClick={() => {
        if (!isOpen) setOpen(true);
      }}
      displayTheme={theme}
      scrolled={scrollY > 14}
    >
      <Wallet>
        <Avatar img={avatar}>
          {!avatar && <NoAvatarIcon />}
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
        <CopyIcon onClick={copyAddress} />
        <GridIcon />
      </WalletActions>
      {isOpen && <CloseLayer onClick={() => setOpen(false)} />}
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

const WalletActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.34rem;

  svg {
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
  }
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
