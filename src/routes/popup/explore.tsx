import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import styled from "styled-components";
import { InputV2, useInput } from "@arconnect/components";
import { SearchIcon } from "@iconicicons/react";
import AppIcon from "~components/popup/home/AppIcon";
import { ShareIcon } from "@iconicicons/react";
import { apps, type App } from "~utils/apps";
import { useTheme } from "~utils/theme";

export default function Explore() {
  const [filteredApps, setFilteredApps] = useState(apps);
  const searchInput = useInput();
  const theme = useTheme();

  useEffect(() => {
    trackPage(PageType.EXPLORE);
  }, []);

  useEffect(() => {
    setFilteredApps(filterApps(apps, searchInput.state));
  }, [searchInput.state]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("explore")} />
      <Wrapper>
        <InputV2
          {...searchInput.bindings}
          small
          fullWidth
          icon={<SearchIcon />}
          placeholder="Search for a dApp"
        />
        <div>
          {filteredApps.map((app, index) => (
            <AppWrapper
              key={index}
              onClick={() => {
                browser.tabs.create({ url: app.links.website });
              }}
            >
              <LogoDescriptionWrapper>
                <LogoWrapper>
                  <AppShortcut
                    bgColor={
                      theme === "light"
                        ? app.assets?.lightBackground
                        : app.assets?.darkBackground
                    }
                  >
                    <Logo src={app.assets.logo} />
                  </AppShortcut>
                </LogoWrapper>
                <Description>
                  <Title>
                    <AppTitle>{app.name}</AppTitle>
                    <Pill>{app.category}</Pill>
                  </Title>
                  <AppDescription>{app.description}</AppDescription>
                </Description>
              </LogoDescriptionWrapper>
              <IconWrapper>
                <ShareIcon
                  style={{ cursor: "pointer" }}
                  width={16}
                  height={16}
                  onClick={() => {
                    browser.tabs.create({ url: app.links.website });
                  }}
                />
              </IconWrapper>
            </AppWrapper>
          ))}
        </div>
      </Wrapper>
    </>
  );
}

const filterApps = (apps: App[], searchTerm: string = ""): App[] => {
  return apps.filter(
    (app: App) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

const IconWrapper = styled.div`
  width: 16px;
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const Wrapper = styled.div`
  padding: 18px 1rem 64px 1rem;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const AppTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: ${(props) => props.theme.primaryTextv2};
`;

const Pill = styled.div`
  color: ${(props) => props.theme.primaryTextv2};
  background-color: ${(props) => props.theme.backgroundSecondary};
  padding: 3px 8px;
  border-radius: 50px;
  border: 1px solid ${(props) => props.theme.inputField};

  font-size: 10px;
`;

const AppDescription = styled.p`
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  font-size: 10px;
  color: ${(props) => props.theme.secondaryTextv2};
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100$;
`;

const Logo = styled.img`
  height: 25px;
  width: 25px;
`;

const AppWrapper = styled.button`
  padding: 10px;
  gap: 12px;
  display: flex;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
`;

const LogoDescriptionWrapper = styled.div`
  gap: 12px;
  display: flex;
`;

const AppShortcut = styled(AppIcon)<{ bgColor?: string }>`
  transition: all 0.125s ease-in-out;
  color: ${(props) => (props.bgColor ? props.bgColor : props.theme.background)};

  width: 32px;
  height: 32px;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.92);
  }
`;
