import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import { getSetting } from "~settings";
import styled from "styled-components";
import { useMemo } from "react";
import { Input } from "@arconnect/components";

export default function String({ name }: Props) {
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
        <Input
          type="text"
          placeholder={"..."}
          value={value}
          // @ts-expect-error
          onChange={(e) => updateSetting(e.target.value)}
          label={browser.i18n.getMessage(settingData.displayName)}
          fullWidth
        />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  padding: 0.8rem 1.2rem;
`;

interface Props {
  name: string;
}
