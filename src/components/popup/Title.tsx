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
  font-size: 1.25rem;
  gap: 0.45rem;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

export const TokenCount = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
  background-color: rgb(${(props) => props.theme.secondaryText}, 0.3);
  border-radius: 5px;
  padding: 0.1rem 0.3rem;
`;

export default Title;
