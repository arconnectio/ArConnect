import { Button, Spacer, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { motion } from "framer-motion";
import styled from "styled-components";

export default function Start() {
  return (
    <Wrapper>
      <ExplainerSection>
        <ExplainTitle>This is an example</ExplainTitle>
        <Spacer y={0.5} />
        <Text noMargin>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Molestias,
          perferendis, alias repudiandae tempora facere, quae laborum eligendi
          natus quibusdam aut beatae? Est accusamus molestias assumenda corporis
          ducimus. Omnis, laudantium optio.
        </Text>
        <Spacer y={1.25} />
        <Button fullWidth>
          Next
          <ArrowRightIcon />
        </Button>
      </ExplainerSection>
      <Pagination>
        <Page />
        <Page active />
        <Page />
      </Pagination>
    </Wrapper>
  );
}

const Wrapper = styled(motion.div).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 }
})`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

const ExplainerSection = styled.div`
  position: absolute;
  left: 3rem;
  bottom: 3rem;
  width: 30%;
`;

const ExplainTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-size: 2.7rem;
  font-weight: 600;
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
`;
