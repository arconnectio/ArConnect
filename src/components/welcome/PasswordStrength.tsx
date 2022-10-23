import { passwordStrength } from "~wallets/generator";
import { Spacer, Text } from "@arconnect/components";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function PasswordStrength({ password }: Props) {
  // get strength
  const strength = useMemo(() => passwordStrength(password), [password]);

  return (
    <>
      <ProgressBar>
        {new Array(5).fill("").map((_, i) => (
          <Bar active={strength >= i + 1} />
        ))}
      </ProgressBar>
      <Spacer y={0.35} />
      <Text noMargin>
        {browser.i18n.getMessage(`password_strength_${strength}`)}
      </Text>
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
