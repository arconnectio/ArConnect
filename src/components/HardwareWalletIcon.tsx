import styled from "styled-components";

const HardwareWalletIcon = styled.div<Props>`
  width: 20px;
  height: 20px;
  background-color: ${(props) => props.color};
  background-image: url(${(props) => props.icon});
  background-size: 74%;
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: 100%;
`;

interface Props {
  icon: string;
  color: string;
}

export default HardwareWalletIcon;
