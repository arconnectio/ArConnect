import type { DragControls } from "framer-motion";
import { DotsIcon } from "@iconicicons/react";
import type { PointerEvent } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function ReorderIcon({ dragControls }: Props) {
  function handler(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    dragControls.start(e);
  }

  return (
    <Wrapper
      onPointerDown={handler}
      title={browser.i18n.getMessage("click_and_drag")}
    >
      <Icon />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  color: rgb(${(props) => props.theme.secondaryText});
`;

const Icon = styled(DotsIcon)`
  font-size: 1.4rem;
  width: 1em;
  height: 1em;
  stroke-width: 2.5px;
  fill: currentColor;

  path {
    stroke-linejoin: bevel;
  }
`;

interface Props {
  dragControls: DragControls;
}
