import { Button, Spacer, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import HexagonBackground from "~components/welcome/start/HexagonBackground";
import Screenshots from "~components/welcome/start/Screenshots";
import Ecosystem from "~components/welcome/start/Ecosystem";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Start() {
  // router
  const [, setLocation] = useLocation();

  // page of the setup
  const [page, setPage] = useState(1);

  // active page
  const activePage = useMemo(
    () => pages.find((_, i) => i === page - 1),
    [page]
  );

  return (
    <Wrapper>
      <Skip onClick={() => setLocation("/generate")}>
        {browser.i18n.getMessage("skip")}
      </Skip>
      <ExplainerSection>
        <ExplainTitle>{browser.i18n.getMessage(activePage.title)}</ExplainTitle>
        <Spacer y={0.5} />
        <ExplainerContent>
          {browser.i18n.getMessage(activePage.content)}
          {activePage.arWiki && (
            <>
              <br />
              {" " + browser.i18n.getMessage("read_more_arwiki") + " "}
              <a
                href={activePage.arWiki}
                target="_blank"
                rel="noopener noreferrer"
              >
                ArWiki
              </a>
              .
            </>
          )}
        </ExplainerContent>
        <Spacer y={1.25} />
        <Button
          fullWidth
          onClick={() => {
            if (page === 3) return setLocation("/generate");
            setPage((val) => val + 1);
          }}
        >
          {browser.i18n.getMessage("next")}
          <ArrowRightIcon />
        </Button>
      </ExplainerSection>
      <Pagination>
        {Array(3)
          .fill("")
          .map((_, i) => (
            <Page
              onClick={() => setPage(i + 1)}
              key={i}
              active={page === i + 1}
            />
          ))}
      </Pagination>
      {page === 1 && (
        <HexagonBackground
          images={Array(27)
            .fill("")
            .map(
              (_, i) => `https://www.arweave.org/images/hexagonbg/${i + 1}.jpg`
            )}
        />
      )}
      {page === 2 && <Ecosystem />}
      {page === 3 && <Screenshots />}
    </Wrapper>
  );
}

const pages: PageInterface[] = [
  {
    title: "what_is_arweave",
    content: "about_arweave",
    arWiki: "https://arwiki.wiki/#/en/Arweave"
  },
  {
    title: "what_is_the_permaweb",
    content: "about_permaweb",
    arWiki: "https://arwiki.wiki/#/en/the-permaweb"
  },
  {
    title: "what_is_arconnect",
    content: "about_arconnect"
  }
];

const Wrapper = styled(motion.div).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 }
})`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const ExplainerSection = styled.div`
  position: absolute;
  left: 3rem;
  bottom: 3rem;
  width: 31%;
`;

const ExplainTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-size: 2.7rem;
  font-weight: 600;
`;

const ExplainerContent = styled(Text).attrs({
  noMargin: true
})`
  text-align: justify;

  a {
    color: rgb(${(props) => props.theme.secondaryText});
  }
`;

const Pagination = styled.div`
  position: absolute;
  right: 3rem;
  bottom: 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Page = styled.span<{ active?: boolean }>`
  width: 3.5rem;
  height: 2px;
  cursor: pointer;
  background-color: rgb(
    ${(props) => props.theme.theme + ", " + (props.active ? "1" : ".45")}
  );
  transition: all 0.23s ease-in-out;
`;

const Skip = styled(Text)`
  position: absolute;
  top: 3rem;
  right: 3rem;
  text-decoration: underline;
  cursor: pointer;
`;

const ArweaveContentWrapper = styled.div`
  top: 0;
  right: 0;
  width: 55%;
  height: 70%;
`;

interface PageInterface {
  // i18n key
  title: string;
  // i18n key
  content: string;
  // arwiki link
  arWiki?: string;
}
