import { ButtonV2, Spacer, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { useMemo } from "react";
import Screenshots from "~components/welcome/Screenshots";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Ecosystem from "./ecosystem";
import Arweave from "./arweave";

export default function Start() {
  // router
  const [, setLocation] = useLocation();

  // route
  const [, params] = useRoute<{ page: string }>("/start/:page");

  // page of the setup
  const page = useMemo(() => {
    const page = Number(params?.page || "1");

    if (![1, 2, 3].includes(page)) return 1;

    return page;
  }, [params]);

  // active page
  const activePage = useMemo(
    () => pages.find((_, i) => i === page - 1),
    [page]
  );

  return (
    <Wrapper>
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
        <ButtonWrapper>
          <ButtonV2
            fullWidth
            onClick={() =>
              setLocation(page === 3 ? "/generate/1" : `/start/${page + 1}`)
            }
          >
            {browser.i18n.getMessage("next")}
            <ArrowRightIcon style={{ marginLeft: "5px" }} />
          </ButtonV2>
          <ButtonV2
            secondary
            fullWidth
            onClick={() => setLocation("/generate/1")}
          >
            {browser.i18n.getMessage("skip")}
          </ButtonV2>
        </ButtonWrapper>
      </ExplainerSection>
      <Pagination>
        {Array(3)
          .fill("")
          .map((_, i) => (
            <Page
              onClick={() => setLocation(`/start/${i + 1}`)}
              key={i}
              active={page === i + 1}
            />
          ))}
      </Pagination>
      {page === 1 && <Arweave />}
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

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

interface PageInterface {
  // i18n key
  title: string;
  // i18n key
  content: string;
  // arwiki link
  arWiki?: string;
}
