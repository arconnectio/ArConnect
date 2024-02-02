import type { HTMLProps } from "react";
import BaseElement, { SettingIcon } from "./BaseElement";
import styled from "styled-components";
import { User01 } from "@untitled-ui/icons-react";

export default function ContactListItem({
  name,
  address,
  profileIcon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <ContactWrapper active={active}>
      {/* @ts-ignore */}
      <Contact title={name} description={address} img={profileIcon} {...props}>
        {!profileIcon && <SettingIcon as={User01} />}
      </Contact>
    </ContactWrapper>
  );
}

interface Props {
  name: string;
  address: string;
  profileIcon: string;
  active: boolean;
}

const ContactWrapper = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${(props) => (props.active ? "0px 12.8px" : "0px 12.8px")};
  border-radius: 20px;
  background-color: rgba(
    ${(props) => props.theme.theme},
    ${(props) =>
      props.active ? (props.theme.displayTheme === "light" ? ".2" : ".1") : "0"}
  );
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) =>
        props.theme.theme +
        ", " +
        (props.active
          ? props.theme.displayTheme === "light"
            ? ".24"
            : ".14"
          : props.theme.displayTheme === "light"
          ? ".14"
          : ".04")}
    );
  }
`;

const Contact = styled(BaseElement)`
  &:hover {
    background-color: transparent;
  }
`;
