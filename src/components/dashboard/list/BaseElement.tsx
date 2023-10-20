import type { DragControls } from "framer-motion";
import { SettingsIcon } from "@iconicicons/react";
import { Text } from "@arconnect/components";
import type { HTMLProps, ReactNode } from "react";
import Squircle from "~components/Squircle";
import ReorderIcon from "../ReorderIcon";
import styled from "styled-components";
import { hoverEffect } from "~utils/theme";

export default function BaseListElement({
  children,
  title,
  description,
  img,
  dragControls,
  right,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <SettingWrapper {...(props as any)}>
      <ContentWrapper>
        <SettingIconWrapper img={img}>{children}</SettingIconWrapper>
        <div>
          <SettingName>{title}</SettingName>
          <SettingDescription>{description}</SettingDescription>
        </div>
      </ContentWrapper>
      {dragControls && <ReorderIcon dragControls={dragControls} />}
      {right}
    </SettingWrapper>
  );
}

const SettingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  position: relative;
  transition: transform 0.07s ease-in-out, opacity 0.23s ease-in-out;

  ${hoverEffect}

  &::after {
    width: calc(100% + 15px);
    height: calc(100% + 4px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
`;

const SettingIconWrapper = styled(Squircle)`
  position: relative;
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  color: rgb(${(props) => props.theme.theme});
`;

export const SettingIcon = styled(SettingsIcon)`
  position: absolute;
  font-size: 1.5rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const SettingName = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  font-weight: 500;
  font-size: 1.05rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 250px;
`;

const SettingDescription = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.7rem;
`;

export const SettingImage = styled.img.attrs({
  alt: "icon",
  draggable: false
})`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.5rem;
  user-select: none;
  transform: translate(-50%, -50%);
`;

interface Props {
  title: string | ReactNode;
  description: string | ReactNode;
  img?: string;
  dragControls?: DragControls;
  right?: ReactNode;
}

export const SettingsList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;
