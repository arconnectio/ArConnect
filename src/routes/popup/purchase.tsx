import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { hoverEffect } from "~utils/theme";
import { CloseIcon } from "@iconicicons/react";

export default function Purchase() {
  const [push] = useHistory();

  return (
    <Wrapper>
      <Header>
        <Title>{browser.i18n.getMessage("buy_screen_title")}</Title>
        <BackWrapper>
          <ExitIcon onClick={() => push("/")}>
            {browser.i18n.getMessage("exit_buy_screen")}
          </ExitIcon>
        </BackWrapper>
      </Header>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 23.6px 12px 12.4px 12px;
`;
const Title = styled.div`
  color: #ab9aff;
  display: inline-block;
  font-size: 22px;
  font-weight: 500;
`;
const BackWrapper = styled.div`
  position: relative;
  display: flex;
  width: max-content;
  height: max-content;
  cursor: pointer;

  ${hoverEffect}

  &::after {
    width: 158%;
    height: 158%;
    border-radius: 100%;
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const ExitIcon = styled(CloseIcon)`
  color: #ab9aff;
  height: 30px;
  width: 30px;
`;
