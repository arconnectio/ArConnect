import { useEffect, useMemo, useState, type HTMLProps } from "react";
import styled from "styled-components";

export const Checkbox = ({
  checked,
  onChange,
  id,
  size = 28
}: CheckboxProps & Omit<HTMLProps<HTMLDivElement>, "onChange">) => {
  const [state, setState] = useState(checked);
  const effectiveId = useMemo(() => id || generateUniqueId(), []);

  async function toggle() {
    let newVal = state;

    setState((val) => {
      newVal = !val;
      return newVal;
    });

    if (onChange) {
      await onChange(newVal);
    }
  }

  useEffect(() => setState(checked), [checked]);

  return (
    <CheckboxWrapper>
      <CheckboxInput checked={state} onChange={toggle} id={effectiveId} />
      <Label htmlFor={effectiveId} size={size}></Label>
    </CheckboxWrapper>
  );
};

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
  size?: number;
}

const CheckboxWrapper = styled.div`
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

// Function to generate a unique ID
const generateUniqueId = (): string => {
  return `checkbox-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export default Checkbox;
