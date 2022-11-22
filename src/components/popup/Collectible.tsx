import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { Card, DisplayTheme, Spacer } from "@arconnect/components";
import { useTheme } from "~utils/theme";
import styled from "styled-components";

export default function Collectible({ id, size = "small" }: Props) {
  // display theme
  const theme = useTheme();

  return (
    <Wrapper displayTheme={theme} size={size}>
      <ImageWrapper size={size}>
        <Image src={concatGatewayURL(defaultGateway) + `/${id}`} />
      </ImageWrapper>
      <Spacer y={0.34} />
      <Data>
        <Title>Example title</Title>
        <SmallData>
          <Balance>2 AR</Balance>
          <Balance>
            1.12<span>AR</span>
          </Balance>
        </SmallData>
      </Data>
    </Wrapper>
  );
}

const sizes = {
  small: "128px",
  large: "182px"
};

const Wrapper = styled(Card)<{
  displayTheme: DisplayTheme;
  size: "small" | "large";
}>`
  padding: 0;
  background-color: rgb(
    ${(props) =>
      props.displayTheme === "light" ? "0, 0, 0" : props.theme.cardBackground}
  );
  border: none;
  width: ${(props) => sizes[props.size]};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.18s ease-in-out;

  &:active {
    transform: scale(0.95);
  }
`;

const ImageWrapper = styled.div<{ size: "small" | "large" }>`
  position: relative;
  width: 100%;
  height: ${(props) => sizes[props.size]};
`;

const Image = styled.img.attrs({
  alt: "",
  draggable: false
})`
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
`;

const Data = styled.div`
  padding: 0.2rem 0.44rem 0.44rem;
`;

const SmallData = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.2rem;
`;

const Title = styled.p`
  font-size: 1.15rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
  line-height: 1.05em;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
`;

const Balance = styled(Title)`
  display: flex;
  align-items: baseline;
  font-size: 0.82rem;
  color: rgb(${(props) => props.theme.theme});
  text-transform: uppercase;
  width: max-content;

  span {
    font-size: 0.68em;
  }
`;

interface Props {
  id: string;
  size?: "small" | "large";
}
