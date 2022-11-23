import { DisplayTheme, Section } from "@arconnect/components";
import { MaximizeIcon } from "@iconicicons/react";
import { useTheme } from "~utils/theme";
import styled from "styled-components";

export default function Thumbnail({ src }: Props) {
  // display theme
  const theme = useTheme();

  return (
    <Wrapper>
      <ThumbnailImage src={src} displayTheme={theme}>
        <FullScreenButton href={src} target="_blank" rel="noopener noreferer">
          <MaximizeIcon />
        </FullScreenButton>
      </ThumbnailImage>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  padding-top: 0;
  padding-bottom: 0;
`;

const ThumbnailImage = styled.div<{ displayTheme: DisplayTheme; src: string }>`
  position: relative;
  width: 100%;
  padding-top: 100%;
  background-color: rgb(
    ${(props) =>
      props.displayTheme === "light" ? "0, 0, 0" : props.theme.cardBackground}
  );
  background-size: cover;
  background-image: url(${(props) => props.src});
  border-radius: 40px;
  overflow: hidden;
`;

const FullScreenButton = styled.a`
  position: absolute;
  display: block;
  right: 1.2rem;
  bottom: 1.2rem;
  width: 33px;
  height: 33px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  text-decoration: none;
  border-radius: 100%;
  transition: all 0.23s ease-in-out;

  &:active {
    transform: scale(0.92);
  }

  svg {
    position: absolute;
    top: 50%;
    left: 50%;
    color: #fff;
    font-size: 1em;
    width: 25px;
    height: 25px;
    transform: translate(-50%, -50%);
  }
`;

interface Props {
  src: string;
}
