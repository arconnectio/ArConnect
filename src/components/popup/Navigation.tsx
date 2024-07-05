import type { DisplayTheme } from "@arconnect/components";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Compass03,
  Home01,
  Home02
} from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useLocation } from "wouter";
import { useHistory } from "~utils/hash_router";
import { useTheme } from "~utils/theme";

const buttons = [
  {
    title: "Home",
    icon: <Home02 />,
    size: "24px",
    route: "/"
  },
  {
    title: "Send",
    icon: <ArrowUpRight />,
    size: "24px",
    route: "/send/transfer"
  },
  {
    title: "Receive",
    icon: <ArrowDownLeft />,
    size: "24px",
    route: "/receive"
  },
  {
    title: "Explore",
    icon: <Compass03 />,
    size: "24px",

    route: "/explore"
  }
];

export const NavigationBar = () => {
  const theme = useTheme();
  const [push] = useHistory();
  const [location] = useLocation();
  const shouldShowNavigationBar =
    location !== "/explore" &&
    buttons.some((button) => {
      if (button.title === "Send") {
        return location.startsWith(button.route);
      } else {
        return location === button.route;
      }
    });

  if (!shouldShowNavigationBar) {
    return null;
  }

  return (
    <NavigationBarWrapper displayTheme={theme}>
      <NavigationButtons>
        {buttons.map((button, index) => {
          const active = button.route === location;
          return (
            <NavigationButton
              displayTheme={theme}
              active={active}
              key={index}
              onClick={() => push(button.route)}
            >
              <IconWrapper displayTheme={theme} size={button.size}>
                {button.icon}
              </IconWrapper>
              <div>{browser.i18n.getMessage(button.title)}</div>
            </NavigationButton>
          );
        })}
      </NavigationButtons>
    </NavigationBarWrapper>
  );
};

const NavigationBarWrapper = styled.div<{ displayTheme: DisplayTheme }>`
  z-index: 5;
  border-top: 2px solid ${(props) => props.theme.primary};
  position: fixed;
  bottom: 0;
  color: white;
  height: 62px;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#F5F5F5" : "#191919"};
  width: 378px;
`;

const NavigationButton = styled.div<{
  active?: boolean;
  displayTheme: DisplayTheme;
}>`
  color: ${(props) =>
    props.displayTheme === "light"
      ? props.active
        ? "#191919"
        : "#757575"
      : props.active
      ? "#fff"
      : "#a3a3a3"};
  font-weight: 500;
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const IconWrapper = styled.div<{ size: string; displayTheme: DisplayTheme }>`
  color: ${(props) => (props.displayTheme === "light" ? "#191919" : "#f5f5f5")};
  padding: 2px;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  display: flex;
  justify-content: center;
  align-items: center; // Center vertically
`;

const NavigationButtons = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-around;
`;
