import {
  ArrowDownLeft,
  ArrowUpRight,
  Compass03,
  Home02
} from "@untitled-ui/icons-react";
import styled from "styled-components";
import { useLocation } from "wouter";
import { useHistory } from "~utils/hash_router";

//TODO: Make sure there's space to see all collectibles

export const NavigationBar = () => {
  // router push
  const [push] = useHistory();
  const [location] = useLocation();
  return (
    <NavigationWrapper>
      <Buttons>
        <Button active={location === "/"}>
          <ActionButton as={Home02} onClick={() => push("/")} />
          Home
        </Button>
        <Button active={location === "/send/transfer"}>
          <ActionButton onClick={() => push("/send/transfer")} />
          Send
        </Button>
        <Button active={location === "/receive"}>
          <ActionButton as={ArrowDownLeft} onClick={() => push("/receive")} />
          Receive
        </Button>
        <Button active={location === "/explore"}>
          <ActionButton as={Compass03} onClick={() => push("/explore")} />
          Explore
        </Button>
      </Buttons>
    </NavigationWrapper>
  );
};
// border-bottom: 5px solid rgb(171, 154, 255, 0.15);

const Buttons = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Button = styled.div<{ active: boolean }>`
  display: flex;
  justify-content: center;
  flex-direction: column;
  border-bottom: 8px solid
    ${(props) => (props.active ? `rgba(171, 154, 255)` : `transparent`)};
  width: 100%;
  height: 100%;
  align-items: center;
`;

const ActionButton = styled(ArrowUpRight)`
  color: #fff;
  font-size: 1.9rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.87);
  }
`;

const NavigationWrapper = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 79px;
  color: #ebebf1;

  background: rgb(26, 23, 38);
  border-top-left-radius: 40px;
  border-top-right-radius: 40px;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
