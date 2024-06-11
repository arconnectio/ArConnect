import { Section } from "@arconnect/components";
import { useState } from "react";
import styled from "styled-components";
import browser from "webextension-polyfill";
import Tokens from "./Tokens";
import Collectibles from "./Collectibles";
import Transactions from "./Transactions";

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
              active={tab.id === activeTab}
              onClick={() => setActiveTab(tab.id)}
            >
              {browser.i18n.getMessage(tab.name)}
            </Tab>
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

const Tab = styled.div<{ active?: boolean }>`
  position: relative;
  height: 25px;
  font-weight: 500;
  font-size: 18px;
  line-height: 25px;
  // color: ${(props) => (props.active ? "#ffffff" : "#a3a3a3")};
  color: ${(props) =>
    `rgb(${
      props.active ? props.theme.primaryText : props.theme.secondaryText
    })`};
  cursor: pointer;

  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${(props) => (props.active ? "#8e7bea" : "#a3a3a3")};
    transition: transform 0.3s ease-in-out;
    transform: scaleX(${(props) => (props.active ? 1 : 0)});
  }
`;

const Underline = styled.div<{ active?: boolean }>`
  border: 1px solid #a3a3a3;
  transition: border-color 0.3s ease-in-out;
`;

const ContentWrapper = styled.div`
  margin-top: 16px;
  width: 100%;
`;
