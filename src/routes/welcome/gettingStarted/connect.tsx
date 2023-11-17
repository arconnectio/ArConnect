import { Spacer, Text } from "@arconnect/components";
import xLogo from "url:/assets/setup/x-logo.svg";
import discordLogo from "url:/assets/setup/discord-logo.svg";
import infoLogo from "url:/assets/setup/info-logo.svg";
import githubLogo from "url:/assets/setup/github-logo.svg";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";

export default function Connect() {
  // Segment
  useEffect(() => {
    trackPage(PageType.SETUP_CONNECT);
  }, []);

  return (
    <Wrapper>
      <div>
        <Text heading>{browser.i18n.getMessage("connect_with_us_title")}</Text>
        <Paragraph>{browser.i18n.getMessage("connect_paragraph")}</Paragraph>
        <Paragraph>{browser.i18n.getMessage("connect_paragraph_2")}</Paragraph>
      </div>
      <Content>
        <Item
          href="https://www.arconnect.io/twitter"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ImageWrapper>
            <Image
              src={xLogo}
              alt={"X Logo"}
              draggable={false}
              width={"0.75rem"}
              height={"0.9375rem"}
            />
          </ImageWrapper>
          <ItemTitle>X</ItemTitle>
        </Item>
        <Item
          href="https://discord.com/invite/YGXJbuz44K"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ImageWrapper>
            <Image
              src={discordLogo}
              alt={"discord logo"}
              draggable={false}
              width={"0.75rem"}
              height={"0.9375rem"}
            />
          </ImageWrapper>
          <ItemTitle>Discord</ItemTitle>
        </Item>
        <Item
          href="https://github.com/arconnectio"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ImageWrapper>
            <Image
              src={githubLogo}
              alt={"github logo"}
              draggable={false}
              width={"0.9375rem"}
              height={"1rem"}
            />
          </ImageWrapper>
          <ItemTitle>Github</ItemTitle>
        </Item>
        {/* TODO: point this to knowledge base */}
        <Item
          href="https://www.arconnect.io/blog"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ImageWrapper>
            <Image
              src={infoLogo}
              alt={"info logo"}
              draggable={false}
              width={"0.4375rem"}
              height={"0.9375rem"}
            />
          </ImageWrapper>
          <ItemTitle>Learn</ItemTitle>
        </Item>
      </Content>
      <Spacer y={1.5} />
    </Wrapper>
  );
}
const Wrapper = styled.div`
  display: flex;
  gap: 4.875rem;
  flex-direction: column;
  justify-content: space-between;
`;

const ItemTitle = styled.div`
  color: #ab9aff;
  font-size: 1rem;
`;

const Item = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ab9aff;
  font-weight: 500;
  gap: 1.25rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.07s ease-in-out;

  &:hover {
    transform: scale(0.925);
    opacity: 0.8;
  }
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  background: rgba(171, 154, 255);
  border: 1px solid #ab9aff;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 12px;
`;

const Content = styled.div`
  justify-content: center;
  display: flex;
  gap: 3.25rem;
`;

const Image = styled.img<{ width: string; height: string }>`
  padding: 0.625rem;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
`;
