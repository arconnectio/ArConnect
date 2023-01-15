import { AnimatedQRScanner as Scanner } from "@arconnect/keystone-sdk";
import type { ComponentProps } from "react";
import styled from "styled-components";

const AnimatedQRScanner = ({ className, ...props }: Props) => (
  <Outline>
    <Wrapper>
      <Scanner {...props} />
    </Wrapper>
  </Outline>
);

export default AnimatedQRScanner;

const Outline = styled.div`
  padding: 10px;
  border: 2px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 18px;
`;

const Wrapper = styled.div`
  width: 400px;
  height: 400px;
  overflow: hidden;
  border-radius: 8px;

  @media screen and (max-width: 1080px) {
    width: 340px;
    height: 340px;
  }

  @media screen and (max-width: 720px) {
    width: 80vw;
    height: 80vw;
  }
`;

interface Props extends ComponentProps<typeof Scanner> {
  className?: string;
}
