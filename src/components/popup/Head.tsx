import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { DisplayTheme, Section, Text } from "@arconnect/components";
import { Avatar, CloseLayer, NoAvatarIcon } from "./WalletHeader";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ArrowLeftIcon } from "@iconicicons/react";
import type { AnsUser } from "~lib/ans";
import { useTheme } from "~utils/theme";
import { motion } from "framer-motion";
import WalletSwitcher from "./WalletSwitcher";
import styled from "styled-components";

export default function Head({ title, showOptions = true }: Props) {
  // scroll position
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    const listener = () => {
      const newDir = window.scrollY > 0 ? "down" : "up";

      if (newDir === scrollDirection) return;
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
  const avatar = useMemo(() => {
    if (!!ans?.avatar) {
      return concatGatewayURL(defaultGateway) + "/" + ans.avatar;
    }

    return undefined;
  }, [ans]);

  // first render for animation
  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => setFirstRender(false), []);

  // wallet switcher open
  const [isOpen, setOpen] = useState(false);

  return (
    <HeadWrapper displayTheme={theme} scrolled={scrollDirection === "down"}>
      <BackWrapper>
        <BackButton onClick={() => history.back()} />
      </BackWrapper>
      <PageInfo
        key={scrollDirection}
        scrollDirection={scrollDirection}
        firstRender={firstRender}
      >
        <PageTitle>{title}</PageTitle>
        <ClickableAvatar img={avatar} onClick={() => setOpen(true)}>
          {!avatar && <NoAvatarIcon />}
        </ClickableAvatar>
      </PageInfo>
      {isOpen && <CloseLayer onClick={() => setOpen(false)} />}
      <WalletSwitcher
        open={isOpen}
        close={() => setOpen(false)}
        showOptions={showOptions}
      />
    </HeadWrapper>
  );
}

const HeadWrapper = styled(Section)<{
  scrolled: boolean;
  displayTheme: DisplayTheme;
}>`
  position: sticky;
  display: flex;
  align-items: ${(props) => (props.scrolled ? "center" : "flex-start")};
  flex-direction: ${(props) => (props.scrolled ? "row" : "column")};
  gap: ${(props) => (props.scrolled ? "0.77rem" : "0.5rem")};
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
  display: flex;
  overflow: hidden;
  width: max-content;
  height: max-content;
`;

const BackButton = styled(ArrowLeftIcon)`
  font-size: 1.6rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
  cursor: pointer;
  transform: translateX(0);
  opacity: 1;
  transition: all 0.23s ease-in-out;

  path {
    stroke-width: 1.75 !important;
  }

  &:hover {
    opacity: 0.7;
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
`;

interface Props {
  title: string;
  showOptions?: boolean;
}
