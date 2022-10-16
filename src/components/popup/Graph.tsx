import styled, { useTheme } from "styled-components";
import type { HTMLProps, ReactNode } from "react";
import { Section } from "@arconnect/components";

export default function Graph({
  children,
  actionBar,
  ...props
}: HTMLProps<HTMLDivElement> & GraphProps) {
  return (
    <Section size="slim">
      <Wrapper {...(props as any)}>
        <Content>
          <ChildrenWrapper>{children}</ChildrenWrapper>
          <ActionBar>{actionBar}</ActionBar>
        </Content>
        <Chart />
      </Wrapper>
    </Section>
  );
}

interface GraphProps {
  actionBar?: ReactNode;
}

const Wrapper = styled.div`
  position: relative;
  background-color: #000;
  border-radius: 40px;
  overflow: hidden;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  color: #fff;
  z-index: 10;
`;

const ChildrenWrapper = styled.div`
  padding: 2rem;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
`;

const Chart = () => {
  const theme = useTheme();

  return (
    <ChartSvg
      width="500"
      height="180"
      viewBox="0 0 500 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask id="path-1-inside-1_246_144" fill="white">
        <path d="M75 84.5L71.5 81L67 84.5L63.5 90.5L60.5 94.5L56.5 97.5L52 100.5L47 102.5L40 99.5L33 102.5L27.5 108L24.5 113L18.5 106.5L13.5 103.5H7.5L3 101.5L0 98.5V116H500V0L493.5 2L488.5 4.5L483.5 7.5L479.5 10.5L475.5 14L471.5 18L464.5 20L458 23L453.5 27.5L448 29L443 32L439 36L434 38.5L430 36L425 35L420 33L414.5 30L409.5 32L401.5 34L395.5 36.5L389 38.5L382 41L375 43L371.5 39L369 33.5L365 29.5L361.5 27L358 32L356.5 37.5L352.5 41L348 46L344 52L338 50L330.5 48.5L324 46L318 44.5L311.5 43L306 46L299 49.5L293 51.5L287.5 53.5L281.5 56.5L276 59.5L272 56.5L267.5 53.5L264 51L260.5 47.5L256 44L251.5 41.5L248 38L244 36L240.5 34L237.5 30L236 32.5L234.5 36L233.5 38L232 41.5L230 43.5L228.5 46L227 49.5L225.5 52.5L222 54.5L218.5 56L216 59.5L214.5 63.5L211 65L208 68.5L205 73L201 75.5L198 79.5L194.5 76.5L191.5 72.5L188.5 69.5L184.5 67L181.5 63L178.5 59.5L172.5 60L166.5 62L160 57.5L154.5 52L149.5 57.5L143.5 62L140 68.5L135.5 74L124.5 84.5L121 84L116 83.5L113 82.5L109 81L106 81.5L103 83.5L100.5 85.5L97.5 87.5L95 90.5L93.5 88L91 85.5L88 81L82.5 83L78 83.5L75 84.5Z" />
      </mask>
      <path
        d="M75 84.5L71.5 81L67 84.5L63.5 90.5L60.5 94.5L56.5 97.5L52 100.5L47 102.5L40 99.5L33 102.5L27.5 108L24.5 113L18.5 106.5L13.5 103.5H7.5L3 101.5L0 98.5V116H500V0L493.5 2L488.5 4.5L483.5 7.5L479.5 10.5L475.5 14L471.5 18L464.5 20L458 23L453.5 27.5L448 29L443 32L439 36L434 38.5L430 36L425 35L420 33L414.5 30L409.5 32L401.5 34L395.5 36.5L389 38.5L382 41L375 43L371.5 39L369 33.5L365 29.5L361.5 27L358 32L356.5 37.5L352.5 41L348 46L344 52L338 50L330.5 48.5L324 46L318 44.5L311.5 43L306 46L299 49.5L293 51.5L287.5 53.5L281.5 56.5L276 59.5L272 56.5L267.5 53.5L264 51L260.5 47.5L256 44L251.5 41.5L248 38L244 36L240.5 34L237.5 30L236 32.5L234.5 36L233.5 38L232 41.5L230 43.5L228.5 46L227 49.5L225.5 52.5L222 54.5L218.5 56L216 59.5L214.5 63.5L211 65L208 68.5L205 73L201 75.5L198 79.5L194.5 76.5L191.5 72.5L188.5 69.5L184.5 67L181.5 63L178.5 59.5L172.5 60L166.5 62L160 57.5L154.5 52L149.5 57.5L143.5 62L140 68.5L135.5 74L124.5 84.5L121 84L116 83.5L113 82.5L109 81L106 81.5L103 83.5L100.5 85.5L97.5 87.5L95 90.5L93.5 88L91 85.5L88 81L82.5 83L78 83.5L75 84.5Z"
        fill={`rgb(${theme.theme})`}
        stroke={`rgb(${theme.theme})`}
        strokeWidth="2"
        mask="url(#path-1-inside-1_246_144)"
      />
      <rect y="115" width="500" height="100" fill={`rgb(${theme.theme})`} />
    </ChartSvg>
  );
};

const ChartSvg = styled.svg`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
`;
