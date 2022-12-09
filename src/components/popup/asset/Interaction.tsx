import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CodeIcon
} from "@iconicicons/react";
import { DisplayTheme, Text } from "@arconnect/components";
import type { TokenInteraction } from "~tokens/token";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { formatAddress } from "~utils/format";
import { useEffect, useState } from "react";
import { useTheme } from "~utils/theme";
import Squircle from "~components/Squircle";
import styled from "styled-components";

export default function Interaction({
  id,
  type,
  qty,
  otherAddress,
  function: fn
}: TokenInteraction) {
  // display theme
  const displayTheme = useTheme();

  // recipient
  const [recipient, setRecipient] = useState("");

  // fetch recipient label
  useEffect(() => {
    (async () => {
      if (!otherAddress) {
        return;
      }

      setRecipient(formatAddress(otherAddress, 6));

      const ans = (await getAnsProfile(otherAddress)) as AnsUser;

      if (!ans || !ans.currentLabel) {
        return;
      }

      setRecipient(ans.currentLabel + ".ar");
    })();
  }, [otherAddress]);

  return (
    <Wrapper>
      <DataWrapper>
        <InteractionIconWrapper displayTheme={displayTheme}>
          {type === "in" && <InIcon />}
          {type === "out" && <OutIcon />}
          {type === "interaction" && <InteractionIcon />}
        </InteractionIconWrapper>
        <div>
          <InteractionID>{formatAddress(id, 7)}</InteractionID>
          <Quantity>{qty}</Quantity>
        </div>
      </DataWrapper>
      <Function>{(type === "interaction" && `${fn}()`) || recipient}</Function>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.07s ease-in-out;

  &:hover {
    opacity: 0.82;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const DataWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const InteractionIconWrapper = styled(Squircle)<{ displayTheme: DisplayTheme }>`
  position: relative;
  color: rgb(
    ${(props) =>
      props.displayTheme === "light" ? "0, 0, 0" : props.theme.cardBackground}
  );
  width: 2.65rem;
  height: 2.65rem;
`;

const Icon = styled(ArrowUpRightIcon)`
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 1.7rem;
  width: 1em;
  height: 1em;
  transform: translate(-50%, -50%);
`;

const OutIcon = styled(Icon)`
  color: #ff0000;
`;

const InIcon = styled(Icon).attrs({
  as: ArrowDownLeftIcon
})`
  color: #14d110;
`;

const InteractionIcon = styled(Icon).attrs({
  as: CodeIcon
})`
  color: rgb(${(props) => props.theme.theme});
`;

const InteractionID = styled(Text).attrs({
  noMargin: true
})`
  font-size: 1rem;
  color: rgb(${(props) => props.theme.primaryText});
`;

const Function = styled(InteractionID)`
  font-size: 0.82rem;
  text-align: right;
`;

const Quantity = styled.span`
  font-size: 0.75rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 500;
`;
