import { setting_element_padding } from "./list/BaseElement";
import { SearchIcon } from "@iconicicons/react";
import type { HTMLProps } from "react";
import styled from "styled-components";

export default function SearchInput(
  props: HTMLProps<HTMLInputElement> & Props
) {
  return (
    <Wrapper sticky={props.sticky}>
      <Input {...(props as any)} />
      <InputSearchIcon />
    </Wrapper>
  );
}

const Wrapper = styled.div<Props>`
  position: ${(props) => (props.sticky ? "sticky" : "relative")};
  background: linear-gradient(
      0deg,
      rgba(${(props) => props.theme.cardBorder}, 0.7),
      rgba(${(props) => props.theme.cardBorder}, 0.7)
    ),
    rgb(${(props) => props.theme.background});
  border-radius: 20px;
  overflow: hidden;
  z-index: 10;

  ${(props) =>
    props.sticky
      ? `
    top: 0;
    left: 0;
    right: 0;
  `
      : ""}

  &:focus-within svg {
    color: rgb(${(props) => props.theme.theme});
  }
`;

const Input = styled.input.attrs({
  type: "text"
})`
  margin: 0;
  outline: none;
  border: none;
  background-color: transparent;
  padding: calc(${setting_element_padding} * 3 / 2) ${setting_element_padding};
  padding-left: calc(${setting_element_padding} * 3 / 2);
  width: calc(100% - ${setting_element_padding} * 2);
  color: rgb(${(props) => props.theme.theme});
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.23s ease-in-out;

  &::placeholder {
    color: rgb(${(props) => props.theme.secondaryText});
  }
`;

const InputSearchIcon = styled(SearchIcon)`
  position: absolute;
  top: 50%;
  right: ${setting_element_padding};
  font-size: 1.25rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
  transition: all 0.23s ease-in-out;
  transform: translate(-50%, -50%);
`;

interface Props {
  sticky?: boolean;
}
