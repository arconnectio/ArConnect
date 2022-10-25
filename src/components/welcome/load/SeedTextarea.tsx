import styled from "styled-components";

const SeedTextarea = styled.textarea`
  width: calc(100% - 2rem - 5px);
  height: 125px;
  border: 2.5px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 22px;
  overflow: hidden;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 1rem;
  color: rgb(${(props) => props.theme.theme});
  outline: none;
  resize: none;
  transition: all 0.23s ease-in-out;

  &::placeholder {
    color: rgb(${(props) => props.theme.cardBorder});
  }

  &:focus {
    border-color: rgb(${(props) => props.theme.theme});
  }
`;

export default SeedTextarea;
