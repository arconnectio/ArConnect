import type { Dispatch, SetStateAction } from "react";
import styled from "styled-components";

const Round = styled.div`
  position: relative;
`;

const CheckboxInput = styled.input.attrs({ type: "checkbox" })`
  visibility: hidden;

  &:checked + label {
    background-color: #8e7bea;
    border-color: #8e7bea;
  }

  &:checked + label:after {
    opacity: 1;
  }
`;

const Label = styled.label<{ size: number }>`
  background-color: transparent;
  border: 1.875px solid #8e7bea;
  border-radius: 50%;
  cursor: pointer;
  height: ${(props) => props.size}px;
  left: 0;
  position: absolute;
  top: 0;
  width: ${(props) => props.size}px;

  &:after {
    border: 1.5px solid #fff;
    border-top: none;
    border-right: none;
    content: "";
    height: ${(props) => props.size / 3.4}px;
    left: ${(props) => props.size / 7}px;
    opacity: 0;
    position: absolute;
    top: ${(props) => props.size / 4}px;
    transform: rotate(-45deg);
    width: ${(props) => props.size / 1.7}px;
  }
`;

export const Checkbox = ({
  checked,
  setChecked,
  size = 28
}: {
  checked: boolean;
  setChecked: Dispatch<SetStateAction<boolean>>;
  size?: number;
}) => {
  const handleChange = () => {
    setChecked(!checked);
  };

  return (
    <Round>
      <CheckboxInput checked={checked} onChange={handleChange} />
      <Label htmlFor="checkbox" size={size}></Label>
    </Round>
  );
};

export default Checkbox;
