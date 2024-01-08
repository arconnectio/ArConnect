import {
  type DisplayTheme,
  Section,
  Text,
  Spacer
} from "@arconnect/components";
import { Avatar, CloseLayer, NoAvatarIcon } from "./WalletHeader";
import { AnimatePresence, motion } from "framer-motion";
import { hoverEffect, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { ArrowLeftIcon } from "@iconicicons/react";
import { useAnsProfile } from "~lib/ans";
import { ExtensionStorage } from "~utils/storage";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import { useHistory } from "~utils/hash_router";
import { useEffect, useState } from "react";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import WalletSwitcher from "./WalletSwitcher";
import styled from "styled-components";

export default function HeadV2({
  title,
  showOptions = true,
  back,
  showBack = true,
  allowOpen = true
}: Props) {
  // scroll position
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [scrolled, setScrolled] = useState(false);

  // TODO: figure out if this will still be used
  useEffect(() => {
    const listener = () => {
      const isScrolled = window.scrollY > 0;
      const newDir = isScrolled ? "down" : "up";

      // don't set it again
      if (newDir === scrollDirection) return;
      if (scrolled !== isScrolled) {
        setScrolled(isScrolled);
      }

      // if the difference between the scroll height
      // and the client height if not enough
      // don't let the scroll direction change
      const diff =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      if (diff < 85) return;

      setScrollDirection(newDir);
    };

    window.addEventListener("scroll", listener);

    return () => window.removeEventListener("scroll", listener);
  }, [scrollDirection]);

  // ui theme
  const theme = useTheme();

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const ans = useAnsProfile(activeAddress);

  // first render for animation
  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => setFirstRender(false), []);

  // wallet switcher open
  const [isOpen, setOpen] = useState(false);

  // hardware api type
  const hardwareApi = useHardwareApi();

  // history back
  const [, goBack] = useHistory();

  return (
    <HeadWrapper
      displayTheme={theme}
      collapse={scrollDirection === "down"}
      scrolled={scrolled}
    >
      <BackWrapper>
        <BackButton
          onClick={async () => {
            if (back) await back();
            else goBack();
          }}
        />
      </BackWrapper>

      <PageTitle>{title}</PageTitle>

      <ClickableAvatar
        img={ans?.avatar}
        onClick={() => {
          if (!allowOpen) return;
          setOpen(true);
        }}
      >
        {!ans?.avatar && <NoAvatarIcon />}
        <AnimatePresence initial={false}>
          {hardwareApi === "keystone" && (
            <HardwareWalletIcon
              icon={keystoneLogo}
              color="#2161FF"
              {...hwIconAnimateProps}
            />
          )}
        </AnimatePresence>
      </ClickableAvatar>
      {isOpen && <CloseLayer onClick={() => setOpen(false)} />}
      <WalletSwitcher
        open={isOpen}
        close={() => setOpen(false)}
        showOptions={showOptions}
        exactTop={true}
      />
    </HeadWrapper>
  );
}

const HeadWrapper = styled(Section)<{
  collapse: boolean;
  scrolled: boolean;
  displayTheme: DisplayTheme;
}>`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: row;
  width: full;
  padding: 15px;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(${(props) => props.theme.background}, 0.75);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid;
  border-bottom-color: ${(props) =>
    props.scrolled
      ? "rgba(" +
        (props.displayTheme === "light" ? "235, 235, 241" : "31, 30, 47") +
        ")"
      : "transparent"};
  transition: border-color 0.23s ease-in-out;
`;

const BackWrapper = styled.div`
  position: relative;
  display: flex;
  width: max-content;
  height: max-content;
  cursor: pointer;

  ${hoverEffect}

  &::after {
    width: 158%;
    height: 158%;
    border-radius: 100%;
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const BackButton = styled(ArrowLeftIcon)`
  font-size: 1rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
  z-index: 2;

  path {
    stroke-width: 1.75 !important;
  }
`;

const PageInfo = styled(motion.div).attrs<{
  scrollDirection: "up" | "down";
  firstRender: boolean;
}>((props) => ({
  initial: !props.firstRender
    ? { opacity: 0, y: props.scrollDirection === "up" ? 20 : -20 }
    : undefined,
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: props.scrollDirection === "up" ? -20 : 20 }
}))<{
  firstRender: boolean;
  scrollDirection: "up" | "down";
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const PageTitle = styled(Text).attrs({
  subtitle: true,
  noMargin: true
})`
  font-size: 1.3rem;
  font-weight: 500;
`;

const ClickableAvatar = styled(Avatar)`
  cursor: pointer;
  width: 2.1rem;
  height: 2.1rem;

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }

  ${NoAvatarIcon} {
    font-size: 1.4rem;
  }
`;

interface Props {
  title: string;
  showOptions?: boolean;
  // allow opening the wallet switcher
  showBack?: boolean;
  allowOpen?: boolean;
  back?: (...args) => any;
}
