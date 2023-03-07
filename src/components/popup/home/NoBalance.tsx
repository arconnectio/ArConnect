import { Button, Section, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useHistory } from "~utils/hash_router";
import noBalanceArt from "url:/assets/ar/no_funds.png";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function NoBalance() {
  const [push] = useHistory();

  return (
    <Wrapper>
      <Art src={noBalanceArt} />
      <NoBalanceText>
        {browser.i18n.getMessage("home_no_balance", "$AR")}
      </NoBalanceText>
      <Button onClick={() => push("/receive")} small>
        {browser.i18n.getMessage("home_add_balance")}
        <ArrowRightIcon />
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const NoBalanceText = styled(Text).attrs({
  heading: true,
  noMargin: true
})`
  margin-bottom: 0.75rem;
`;

const Art = styled.img.attrs({
  draggable: false,
  alt: "No balance art"
})`
  user-select: none;
  width: 184px;
`;
