import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { DisplayTheme, Section, Text } from "@arconnect/components";
import { Avatar, NoAvatarIcon } from "./WalletHeader";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ArrowLeftIcon } from "@iconicicons/react";
import type { AnsUser } from "~lib/ans";
import { useTheme } from "~utils/theme";
import styled from "styled-components";

export default function Head({ title }: Props) {
  // scroll position
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const listener = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", listener);

    return () => window.removeEventListener("scroll", listener);
  }, []);

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

  return (
    <HeadWrapper displayTheme={theme} scrolled={scrollY > 14}>
      <BackButton onClick={() => history.back()} />
      <PageInfo>
        <Text subtitle noMargin>
          {title}
        </Text>
        <Avatar img={avatar}>{!avatar && <NoAvatarIcon />}</Avatar>
      </PageInfo>
    </HeadWrapper>
  );
}

const HeadWrapper = styled(Section)<{
  scrolled: boolean;
  displayTheme: DisplayTheme;
}>`
  position: sticky;
  display: flex;
  align-items: ${(props) => (props.scrolled ? "flex-start" : "center")};
  flex-direction: ${(props) => (props.scrolled ? "column" : "row")};
  gap: 0.9rem;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-top: 2.2rem;
  padding-bottom: 1.5rem;
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

const BackButton = styled(ArrowLeftIcon)`
  font-size: 1.45rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

const PageInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

interface Props {
  title: string;
}
