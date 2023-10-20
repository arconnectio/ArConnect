import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import { getSetting } from "~settings";
import { useMemo } from "react";
import styled from "styled-components";
import { CheckIcon } from "@iconicicons/react";
import { Spacer, useInput } from "@arconnect/components";
import SearchInput from "~components/dashboard/SearchInput";

export default function Pick({ name }: Props) {
  // setting state
  const [settingState, updateSetting] = useSetting(name);

  // setting data
  const settingData = useMemo(() => getSetting(name), [name]);

  // fixup displayed option
  const fixupBooleanDisplay = (val: string) => {
    if (val === "false" || val === "true") {
      return browser.i18n.getMessage(val === "true" ? "enabled" : "disabled");
    }

    return val[0].toUpperCase() + val.slice(1);
  };

  // search
  const searchInput = useInput();

  // search filter function
  function searchFilter(option: string) {
    const query = searchInput.state;

    if (query === "" || !query || option === settingState) {
      return true;
    }

    return option.toLowerCase().includes(query.toLowerCase());
  }

  return (
    <>
      <Head title={browser.i18n.getMessage(settingData.displayName)} />
      <Wrapper>
        {(settingData?.options || []).length > 6 && (
          <>
            <SearchInput
              placeholder={browser.i18n.getMessage("search_pick_option")}
              {...searchInput.bindings}
              sticky
            />
            <Spacer y={0.6} />
          </>
        )}
        {(settingData?.options || []).filter(searchFilter).map((option, i) => (
          <RadioElement
            onClick={() => updateSetting(option)}
            active={settingState === option}
            key={i}
          >
            {fixupBooleanDisplay(option.toString())}
            {settingState === option && <CheckIcon />}
          </RadioElement>
        ))}
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.8rem 1.2rem;
`;

const RadioElement = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.96rem;
  padding: 0.8rem 1rem;
  border-radius: 14px;
  background-color: rgba(
    ${(props) => props.theme.theme},
    ${(props) => (props.active ? ".15" : "0")}
  );
  color: rgb(
    ${(props) => (props.active ? props.theme.theme : props.theme.secondaryText)}
  );
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, 0.1);
  }

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
  }
`;

interface Props {
  name: string;
}
