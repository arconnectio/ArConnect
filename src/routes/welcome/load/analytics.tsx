import { Button, Spacer, Text } from "@arconnect/components";
import { useLocation, useRoute } from "wouter";
import { ArrowRightIcon } from "@iconicicons/react";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function Analytics() {
  // analytic
  const [analytic, setAnalytic] = useSetting("analytics");

  // route
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");
  const [, setLocation] = useLocation();

  return (
    <>
      <Text heading>{browser.i18n.getMessage("analytic_title")}</Text>
      <Paragraph>{browser.i18n.getMessage("analytic_description")}</Paragraph>
      <Spacer y={0.5} />
      <AnalyticSelection
        active={analytic === true}
        onClick={() => setAnalytic(true)}
      >
        {browser.i18n.getMessage("accept")}
      </AnalyticSelection>
      <Spacer y={0.5} />
      <AnalyticSelection
        active={analytic === false}
        onClick={() => setAnalytic(false)}
      >
        {browser.i18n.getMessage("decline")}
      </AnalyticSelection>
      <Spacer y={2.5} />
      <Button
        fullWidth
        onClick={() =>
          setLocation(`/${params.setup}/${Number(params.page) + 1}`)
        }
      >
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon />
      </Button>
    </>
  );
}

const AnalyticSelection = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 500;
  padding: 1.35rem 1.45rem;
  color: rgb(${(props) => props.theme.theme});
  border-radius: 25px;
  background-color: ${(props) =>
    props.active ? "rgba(" + props.theme.theme + ", .2)" : "transparent"};
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) => props.theme.theme},
      ${(props) => (props.active ? ".2" : ".1")}
    );
  }
`;
