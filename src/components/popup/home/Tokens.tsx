import { Section, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Token from "../Token";
import Title from "../Title";

export default function Tokens() {
  return (
    <Section>
      <Heading>
        <Title noMargin>{browser.i18n.getMessage("assets")}</Title>
        <ViewAll>
          {browser.i18n.getMessage("view_all")}
          <TokenCount>4</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={0.8} />
      <TokensList>
        <Token
          id="usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A"
          name="Verto"
          ticker="VRT"
          balance={12303.34}
        />
      </TokensList>
    </Section>
  );
}

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ViewAll = styled(Title).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  gap: 0.45rem;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

const TokenCount = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
  background-color: rgb(${(props) => props.theme.secondaryText}, 0.3);
  border-radius: 5px;
  padding: 0.1rem 0.3rem;
`;

const TokensList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
