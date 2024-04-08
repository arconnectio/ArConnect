import {
  type DisplayTheme,
  useModal,
  ModalV2,
  ButtonV2,
  Spacer,
  Text
} from "@arconnect/components";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Compass03,
  Home02
} from "@untitled-ui/icons-react";
import { ExtensionStorage } from "~utils/storage";
import { useHistory } from "~utils/hash_router";
import { useState, useEffect, useMemo } from "react";
import { getActiveAddress, type StoredVault } from "~wallets";
import browser from "webextension-polyfill";
import { useTheme } from "~utils/theme";
import styled from "styled-components";
import { useLocation } from "wouter";
import { useStorage } from "@plasmohq/storage/hook";

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
  const [showWarning, setShowWarning] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const warningModal = useModal();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all vaults added
  const [vaults] = useStorage<StoredVault[]>(
    {
      key: "vaults",
      instance: ExtensionStorage
    },
    []
  );

  const isVault = useMemo(() => {
    return vaults.some((vault) => vault.address === activeAddress);
  }, [vaults, activeAddress]);

  const shouldShowNavigationBar = buttons.some((button) => {
    if (button.title === "Send") {
      return location.startsWith(button.route);
    } else {
      return location === button.route;
    }
  });

  const handleRoute = async (route: string) => {
    if ((route === "/send/transfer" || route === "/receive") && isVault) {
      setPendingRoute(route);
      warningModal.setOpen(true);
    } else {
      push(route);
    }
  };

  const confirmRouteChange = () => {
    if (pendingRoute) {
      push(pendingRoute);
      setPendingRoute(null);
    }
    warningModal.setOpen(false);
  };

  return (
    <>
      {shouldShowNavigationBar && (
        <NavigationBarWrapper displayTheme={theme}>
          <>
            <NavigationButtons>
              {buttons.map((button, index) => {
                const active = button.route === location;
                return (
                  <NavigationButton
                    displayTheme={theme}
                    active={active}
                    key={index}
                    onClick={() => handleRoute(button.route)}
                  >
                    <IconWrapper displayTheme={theme} size={button.size}>
                      {button.icon}
                    </IconWrapper>
                    <div>{button.title}</div>
                  </NavigationButton>
                );
              })}
            </NavigationButtons>
          </>
        </NavigationBarWrapper>
      )}
      {warningModal.isOpen && (
        <ModalV2
          {...warningModal.bindings}
          root={document.getElementById("__plasmo")}
          actions={
            <>
              <ButtonV2 secondary onClick={() => warningModal.setOpen(false)}>
                {browser.i18n.getMessage("no")}
              </ButtonV2>
              <ButtonV2 onClick={() => confirmRouteChange()}>
                {browser.i18n.getMessage("yes")}
              </ButtonV2>
            </>
          }
        >
          <CenterText heading>Warning</CenterText>
          <Spacer y={0.55} />
          <CenterText noMargin>
            {browser.i18n.getMessage("transfering_ar_vault")}
            <br />
            {browser.i18n.getMessage("continue_question")}
          </CenterText>
          <Spacer y={1} />
        </ModalV2>
      )}
    </>
  );
};

const CenterText = styled(Text)`
  text-align: center;
  max-width: 22vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    max-width: 90vw;
  }
`;

const NavigationBarWrapper = styled.div<{ displayTheme: DisplayTheme }>`
  z-index: 5;
  border-top: 2px solid #8e7bea;
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
