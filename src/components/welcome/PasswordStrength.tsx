import { type DiversityType, passwordStrength } from "check-password-strength";
import { CheckIcon, CloseIcon } from "@iconicicons/react";
import { Spacer, Text } from "@arconnect/components";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Paragraph from "~components/Paragraph";

export default function PasswordStrength({ password }: Props) {
  // get strength
  const strength = useMemo(() => passwordStrength(password || ""), [password]);

  // strength index
  const strengthIndex = useMemo(
    () => (strength.id === 0 ? 1 : strength.id + 2),
    [strength]
  );

  // checklist elements
  const checklist: ChecklistElement[] = [
    {
      validity: ["lowercase", "uppercase"],
      display: "password_strength_checklist_case"
    },
    {
      validity: ["number"],
      display: "password_strength_checklist_number"
    },
    {
      validity: ["symbol"],
      display: "password_strength_checklist_symbol"
    }
  ];

  return (
    <>
      <ProgressBar>
        {new Array(5).fill("").map((_, i) => (
          <Bar active={strengthIndex >= i + 1} key={i} />
        ))}
      </ProgressBar>
      <Spacer y={0.35} />
      <Text noMargin>
        {browser.i18n.getMessage(`password_strength_${strengthIndex}`)}
      </Text>
      <Spacer y={0.85} />
      <StrengthChecklist>
        <Paragraph noMargin>{browser.i18n.getMessage("required")}</Paragraph>
        <StrengthCheck length={password ? password.length : 0}>
          {(password && password.length >= 5 && <CheckIcon />) || <CloseIcon />}
          <Text noMargin>
            {browser.i18n.getMessage("password_strength_checklist_length", "5")}
          </Text>
        </StrengthCheck>
        <Paragraph noMargin>{browser.i18n.getMessage("recommended")}</Paragraph>
        {checklist.map((elem, i) => {
          let valid = true;

          for (const diversity of elem.validity) {
            if (strength.contains.includes(diversity)) continue;
            valid = false;
          }

          return (
            <StrengthCheck isValid={valid} key={i}>
              {(valid && <CheckIcon />) || <CloseIcon />}
              <Text noMargin>{browser.i18n.getMessage(elem.display)}</Text>
            </StrengthCheck>
          );
        })}
        <StrengthCheck isValid={password && password.length >= 10}>
          {(password && password.length >= 10 && <CheckIcon />) || (
            <CloseIcon />
          )}
          <Text noMargin>
            {browser.i18n.getMessage(
              "password_strength_checklist_length",
              "10"
            )}
          </Text>
        </StrengthCheck>
      </StrengthChecklist>
    </>
  );
}

interface Props {
  password: string;
}

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Bar = styled.div<{ active: boolean }>`
  width: 18%;
  height: 2px;
  background-color: rgb(
    ${(props) => (props.active ? props.theme.theme : props.theme.cardBorder)}
  );
  transition: all 0.23s ease-in-out;
`;

const StrengthChecklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const StrengthCheck = styled.div<{ isValid?: boolean; length?: number }>`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  p {
    font-size: 0.84rem;
    color: rgb(
      ${(props) => {
        if (props.length !== undefined) {
          if (props.length < 5) {
            return props.theme.secondaryText;
          } else if (props.length >= 5 && props.length < 10) {
            return "255, 221, 87";
          } else {
            return "0, 255, 0";
          }
        }
        return props.isValid ? "0, 255, 0" : props.theme.secondaryText;
      }}
    );
    line-height: 1.1em;
    transition: all 0.17s ease-in-out;
  }

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
    color: rgb(
      ${(props) => {
        if (props.length !== undefined) {
          if (props.length < 5) {
            return "255, 0, 0";
          } else if (props.length >= 5 && props.length < 10) {
            return "255, 221, 87";
          } else {
            return "0, 255, 0";
          }
        }
        return props.isValid ? "0, 255, 0" : "255, 0, 0";
      }}
    );
    transition: all 0.17s ease-in-out;
  }
`;

interface ChecklistElement {
  validity: DiversityType[];
  display: string;
}
