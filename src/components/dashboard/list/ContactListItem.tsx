import { ListItem, ListItemIcon } from "@arconnect/components";
import { User01 } from "@untitled-ui/icons-react";
import type { HTMLProps } from "react";
import styled from "styled-components";

export default function ContactListItem({
  name,
  address,
  profileIcon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <ContactWrapper small={props.small} active={active}>
      {/* @ts-ignore */}
      <Contact title={name} description={address} img={profileIcon} {...props}>
        {!profileIcon && <ListItemIcon as={User01} />}
      </Contact>
    </ContactWrapper>
  );
}

interface Props {
  name: string;
  address: string;
  profileIcon: string;
  active: boolean;
  small?: boolean;
}

const ContactWrapper = styled.div<{ active: boolean; small?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: ${(props) => (props.small ? "10px" : "20px")};
  background-color: rgba(
    ${(props) => props.theme.theme},
    ${(props) =>
      props.active ? (props.theme.displayTheme === "light" ? ".2" : ".1") : "0"}
  );
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) =>
        props.small
          ? "43, 40, 56, 1"
          : props.theme.theme +
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

const Contact = styled(ListItem)`
  &:hover {
    background-color: transparent;
  }
`;
