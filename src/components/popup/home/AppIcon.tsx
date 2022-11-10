import Squircle from "~components/Squircle";
import styled from "styled-components";

const AppIcon = styled(Squircle)<{ color?: string }>`
  color: ${(props) =>
    props.color ? props.color : "rgb(" + props.theme.theme + ")"};
  width: 3rem;
  height: 3rem;
  cursor: pointer;

  img {
    position: absolute;
    top: 50%;
    left: 50%;
    max-width: 2.5em;
    user-select: none;
    transform: translate(-50%, -50%);
    transition: all 0.23s ease-in-out;
  }

  &:hover img {
    opacity: 0.84;
  }
`;

export default AppIcon;
