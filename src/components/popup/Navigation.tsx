import {
  ArrowDownLeft,
  ArrowUpRight,
  Compass03,
  Home02
} from "@untitled-ui/icons-react";
import styled from "styled-components";
import { useLocation } from "wouter";
import { useHistory } from "~utils/hash_router";

export const NavigationBar = () => {
  const [push] = useHistory();
  const [location] = useLocation();

  return (
    <>
      <NavigationWrapper>
        <Buttons>
          <Button active={location === "/"} onClick={() => push("/")}>
            <ActionButton as={Home02} />
          </Button>
          <Button
            active={location === "/send/transfer"}
            onClick={() => push("/send/transfer")}
          >
            <ActionButton />
          </Button>
          <Button
            active={location === "/receive"}
            onClick={() => push("/receive")}
          >
            <ActionButton as={ArrowDownLeft} />
          </Button>
          <Button
            active={location === "/explore"}
            onClick={() => push("/explore")}
          >
            <ActionButton as={Compass03} />
          </Button>
        </Buttons>
      </NavigationWrapper>
    </>
  );
};

const Buttons = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// TODO: Update border bottom if we're keeping the current active identifier
const Button = styled.button<{ active: boolean }>`
  all: unset;
  display: flex;
  justify-content: center;
  flex-direction: column;
  box-sizing: border-box;
  border-bottom: 4px solid
    ${(props) => (props.active ? `rgba(171, 154, 255)` : `transparent`)};
  width: 100%;
  cursor: pointer;
  height: 100%;
  align-items: center;
`;

const ActionButton = styled(ArrowUpRight)`
  color: ${(props) =>
    props.theme.displayTheme === "light" ? "#AB9AFF" : "#ebebf1"};

  width: 1.9em;
  height: 1.9em;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.87);
  }
`;

const NavigationWrapper = styled.div`
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 10;
  height: 3.00625rem;
  color: ${(props) =>
    props.theme.displayTheme === "light" ? "#AB9AFF" : "#ebebf1"};

  border-top: 1px solid
    ${(props) => (props.theme.displayTheme === "light" ? "#DDD9F3" : "#423d59")};
  border-left: 1px solid
    ${(props) => (props.theme.displayTheme === "light" ? "#DDD9F3" : "#423d59")};
  border-right: 1px solid
    ${(props) => (props.theme.displayTheme === "light" ? "#DDD9F3" : "#423d59")};
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;

  background: ${(props) =>
    props.theme.displayTheme === "light" ? "#F3F0FF" : "#2f2c3c"};

  display: flex;
  justify-content: space-between;
  align-items: center;
`;
