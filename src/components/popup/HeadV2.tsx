import {
  type DisplayTheme,
  Section,
  Text,
  Spacer
} from "@arconnect/components";
import { Avatar, CloseLayer, NoAvatarIcon } from "./WalletHeader";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "~utils/theme";
import { useStorage } from "@plasmohq/storage/hook";
import { ArrowLeftIcon } from "@iconicicons/react";
import { useAnsProfile } from "~lib/ans";
import { ExtensionStorage } from "~utils/storage";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import { useHistory } from "~utils/hash_router";
import { useEffect, useMemo, useState } from "react";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import WalletSwitcher from "./WalletSwitcher";
import styled from "styled-components";
import { svgie } from "~utils/svgies";

interface HeadV2Props {
  title: string;
  showOptions?: boolean;
  // allow opening the wallet switcher
  showBack?: boolean;
  padding?: string;
  back?: (...args) => any;
}

export default function HeadV2({
  title,
  showOptions = true,
  back,
  padding,
  showBack = true
}: HeadV2Props) {
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

  const svgieAvatar = useMemo(
    () => svgie(activeAddress, { asDataURI: true }),
    [activeAddress]
  );

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
      padding={padding}
    >
      {showBack ? (
        <BackButton
          onClick={async () => {
            if (back) await back();
            else goBack();
          }}
        >
          <BackButtonIcon />
        </BackButton>
      ) : null}

      <PageTitle>{title}</PageTitle>

      {showOptions ? (
        <AvatarButton>
          <ButtonAvatar
            img={ans?.avatar || svgieAvatar}
            onClick={() => {
              setOpen(true);
            }}
          >
            {!ans?.avatar && !svgieAvatar && <NoAvatarIcon />}
            <AnimatePresence initial={false}>
              {hardwareApi === "keystone" && (
                <HardwareWalletIcon
                  icon={keystoneLogo}
                  color="#2161FF"
                  {...hwIconAnimateProps}
                />
              )}
            </AnimatePresence>
          </ButtonAvatar>
        </AvatarButton>
      ) : null}

      {isOpen && <CloseLayer onClick={() => setOpen(false)} />}

      <WalletSwitcher
        open={isOpen}
        close={() => setOpen(false)}
        exactTop={true}
        showOptions={showOptions}
      />
    </HeadWrapper>
  );
}

const HeadWrapper = styled(Section)<{
  collapse: boolean;
  scrolled: boolean;
  displayTheme: DisplayTheme;
  padding: string;
}>`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 21;
  display: flex;
  flex-direction: row;
  width: full;
  padding: ${(props) => (props.padding ? props.padding : "15px")};
  justify-content: center;
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
  user-select: none;
`;

const BackButton = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  width: max-content;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  height: 100%;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:active svg {
    transform: scale(0.92);
  }
`;

const BackButtonIcon = styled(ArrowLeftIcon)`
  font-size: 1rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
  z-index: 2;

  path {
    stroke-width: 1.75 !important;
  }
`;

const PageTitle = styled(Text).attrs({
  subtitle: true,
  noMargin: true
})`
  font-size: 1.3rem;
  font-weight: 500;
`;

const AvatarButton = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  cursor: pointer;
  padding: 0 15px;
  height: 100%;
  background: transparent;
  border: 0;
`;

const ButtonAvatar = styled(Avatar)`
  width: 2.1rem;
  height: 2.1rem;

  & svg {
    transition: transform 0.07s ease-in-out;
  }

  &:active svg {
    transform: scale(0.93);
  }

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }

  ${NoAvatarIcon} {
    font-size: 1.4rem;
  }
`;
