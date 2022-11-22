import { DisplayTheme, Section } from "@arconnect/components";
import { useTheme } from "~utils/theme";
import styled from "styled-components";

export default function Thumbnail({ src }: Props) {
  const theme = useTheme();

  return (
    <Wrapper>
      <ThumbnailImage src={src} displayTheme={theme}></ThumbnailImage>
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

interface Props {
  src: string;
}
