import { AnimatedQRPlayer as Player } from "@arconnect/keystone-sdk";
import styled, { useTheme } from "styled-components";
import { ComponentProps, useMemo } from "react";

export default function AnimatedQRPlayer(props: ComponentProps<typeof Player>) {
  // global theme
  const theme = useTheme();

  // qr style config
  const config = useMemo(
    () => ({
      bgColor: "transparent",
      fgColor: `rgb(${theme.theme})`,
      eyeRadius: 8,
      maxFragmentLength: 200,
      quietZone: 0,
      size: 345
    }),
    [theme]
  );

  return (
    <Wrapper>
      <Player {...config} {...props} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%;

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
  }
`;
