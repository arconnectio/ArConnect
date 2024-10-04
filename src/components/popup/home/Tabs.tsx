import { Section } from "@arconnect/components";
import { useState, type Dispatch, type SetStateAction } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import Tokens from "./Tokens";
import Collectibles from "./Collectibles";
import Transactions from "./Transactions";

interface TabType {
  id: number;
  name: string;
  component: () => JSX.Element;
}

interface TabProps {
  tab: TabType;
  active: boolean;
  setActiveTab: Dispatch<SetStateAction<number>>;
}

const Tab = ({ tab, active, setActiveTab }: TabProps) => (
  <StyledTab
    active={active}
    tabId={tab.id}
    onClick={() => setActiveTab(tab.id)}
  >
    {browser.i18n.getMessage(tab.name)}
  </StyledTab>
);

export default function Tabs() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, name: "assets", component: Tokens },
    { id: 1, name: "collectibles", component: Collectibles },
    { id: 2, name: "transactions", component: Transactions }
  ];

  const ActiveComponent = tabs[activeTab].component;

  return (
    <>
      <Section>
        <TabsWrapper>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              active={tab.id === activeTab}
              setActiveTab={setActiveTab}
            />
          ))}
        </TabsWrapper>
        <Underline />
        <ContentWrapper>
          <ActiveComponent />
        </ContentWrapper>
      </Section>
    </>
  );
}

const TabsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 25px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
`;

const StyledTab = styled.button<{ active?: boolean; tabId: number }>`
  position: relative;
  height: 25px;
  font-weight: 500;
  font-size: 18px;
  line-height: 25px;
  color: ${(props) => (props.active ? "white" : props.theme.secondaryTextv2)};
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;

  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    height: 2px;
    background: ${(props) =>
      props.active ? "#8e7bea" : props.theme.secondaryTextv2};
    transition: transform 0.3s ease-in-out;
    transform: scaleX(${(props) => (props.active ? 1 : 0)});
    ${(props) => props.tabId === 0 && "left: 0; right: -12px;"}
    ${(props) => props.tabId === 1 && "left: -12px; right: -12px;"}
    ${(props) => props.tabId === 2 && "left: -12px; right: 0;"}
  }
`;

const Underline = styled.div<{ active?: boolean }>`
  border: 1px solid ${(props) => props.theme.secondaryTextv2};
  transition: border-color 0.3s ease-in-out;
`;

const ContentWrapper = styled.div`
  margin-top: 16px;
  width: 100%;
`;
