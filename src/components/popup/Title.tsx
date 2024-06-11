import { Text } from "@arconnect/components";
import styled from "styled-components";

const Title = styled(Text).attrs({
  heading: true
})`
  font-weight: 500;
`;

export const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ViewAll = styled(Title).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  font-size: 1rem;
  gap: 0.2rem;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

export const TokenCount = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: rgb(${(props) => props.theme.primaryText});
  border-radius: 5px;
`;

export default Title;
