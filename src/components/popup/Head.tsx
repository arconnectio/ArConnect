import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { DisplayTheme, Section, Text } from "@arconnect/components";
import { Avatar, CloseLayer, NoAvatarIcon } from "./WalletHeader";
import { useEffect, useMemo, useState } from "react";
import { hoverEffect, useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { ArrowLeftIcon } from "@iconicicons/react";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import { useHistory } from "~utils/hash_router";
import type { AnsUser } from "~lib/ans";
import { AnimatePresence, motion } from "framer-motion";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import WalletSwitcher from "./WalletSwitcher";
import styled from "styled-components";

export default function Head({
  title,
  showOptions = true,
  back,
  allowOpen = true
}: Props) {
  // scroll position
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [scrolled, setScrolled] = useState(false);

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

  // load ans cache
  const [ans] = useStorage<AnsUser>({
    key: "ans_data",
    area: "local",
    isSecret: true
  });

  // user avatar
  const [avatar, setAvatar] = useState<string>();

  useEffect(() => {
    if (ans?.avatar === avatar) return;
    if (!ans?.avatar || !!avatar) return;

    setAvatar(concatGatewayURL(defaultGateway) + "/" + ans.avatar);
  }, [ans]);

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
      <PageInfo
        key={scrollDirection}
        scrollDirection={scrollDirection}
        firstRender={firstRender}
      >
        <PageTitle>{title}</PageTitle>
        <ClickableAvatar
          img={avatar}
          onClick={() => {
            if (!allowOpen) return;
            setOpen(true);
          }}
        >
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
        </ClickableAvatar>
      </PageInfo>
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
  display: flex;
  align-items: ${(props) => (props.collapse ? "center" : "flex-start")};
  flex-direction: ${(props) => (props.collapse ? "row" : "column")};
  gap: ${(props) => (props.collapse ? "0.77rem" : "0.5rem")};
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-top: 2.15rem;
  padding-bottom: 0.8rem;
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
  font-size: 1.6rem;
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
  font-size: 1.5rem;
  font-weight: 500;
`;

const ClickableAvatar = styled(Avatar)`
  cursor: pointer;

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }
`;

interface Props {
  title: string;
  showOptions?: boolean;
  // allow opening the wallet switcher
  allowOpen?: boolean;
  back?: (...args) => any;
}
