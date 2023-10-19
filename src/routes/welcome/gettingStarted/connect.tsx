import { Spacer, Text } from "@arconnect/components";
import twitterLogo from "url:/assets/setup/twitter-logo.svg";
import discordLogo from "url:/assets/setup/discord-logo.svg";
import infoLogo from "url:/assets/setup/info-logo.svg";
import githubLogo from "url:/assets/setup/github-logo.svg";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Connect() {
  // Segment
  // useEffect(() => {
  //   trackPage(PageType.ONBOARD_COMPLETE);
  // }, []);

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
              src={twitterLogo}
              alt={"twitter logo"}
              draggable={false}
              width={"12px"}
              height={"15px"}
            />
          </ImageWrapper>
          <ItemTitle>Twitter</ItemTitle>
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
              width={"12px"}
              height={"15px"}
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
              width={"15px"}
              height={"16px"}
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
              width={"7px"}
              height={"15px"}
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
`;

const ImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  background: rgba(171, 154, 255);
  border: 1px solid #ab9aff;
  width: 34px;
  height: 34px;
  border-radius: 12px;
`;

const Content = styled.div`
  justify-content: center;
  display: flex;
  gap: 3.25rem;
`;

const Image = styled.img<{ width: string; height: string }>`
  padding: 10px;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
`;
