import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import { getSetting } from "~settings";
import styled from "styled-components";
import { useMemo } from "react";

export default function NumberSetting({ name }: Props) {
  if (!name) return <></>;

  // setting state
  const [settingState, updateSetting] = useSetting(name);

  // setting data
  const settingData = useMemo(() => getSetting(name), [name]);

  // active
  const value = useMemo(
    () =>
      typeof settingState === "undefined"
        ? settingData.defaultValue
        : settingState,
    [settingState, settingData]
  );

  return (
    <>
      <Head title={browser.i18n.getMessage(settingData.displayName)} />
      <Wrapper>
        <Btn onClick={() => updateSetting((v: number) => v + 1)}>+</Btn>
        <Input
          type="number"
          placeholder={"100"}
          value={value}
          onChange={(e) => updateSetting(Number(e.target.value))}
        />
        <Btn onClick={() => updateSetting((v: number) => v - 1)}>-</Btn>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  padding: 0.8rem 1.2rem;
`;

const Btn = styled.button`
  display: block;
  font-size: 1.85rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 600;
  text-align: center;
  padding: 1rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: all 0.17s ease;

  &:active {
    transform: scale(0.87);
  }
`;

const Input = styled.input`
  font-size: 1.85rem;
  color: rgb(${(props) => props.theme.theme});
  font-weight: 600;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  -moz-appearance: textfield;
  width: 100%;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

interface Props {
  name: string;
}
