import type { HTMLProps } from "react";
import BaseElement from "./BaseElement";
import styled from "styled-components";

export default function ContactListItem({
  name,
  address,
  profileIcon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <BaseElement
      title={name}
      description={address}
      active={active}
      img={profileIcon}
      {...props}
    ></BaseElement>
  );
}

interface Props {
  name: string;
  address: string;
  profileIcon: string;
  active: boolean;
}
