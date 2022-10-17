import { HTMLProps, ReactNode, useMemo } from "react";
import { Section, Text } from "@arconnect/components";
import styled, { useTheme } from "styled-components";

export default function Graph({
  children,
  actionBar,
  data,
  ...props
}: Omit<HTMLProps<HTMLDivElement>, "data"> & GraphProps) {
  return (
    <GraphSection size="slim">
      <Wrapper {...(props as any)}>
        <Content>
          <ChildrenWrapper>{children}</ChildrenWrapper>
          <ActionBar>{actionBar}</ActionBar>
        </Content>
        <Chart data={data} />
      </Wrapper>
    </GraphSection>
  );
}

interface GraphProps {
  actionBar?: ReactNode;
  data: number[];
}

const GraphSection = styled(Section)`
  padding-top: 0;
`;

const Wrapper = styled.div`
  position: relative;
  background-color: #000;
  border-radius: 40px;
  overflow: hidden;
  z-index: 1;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  color: #fff;
  z-index: 20;
  gap: 2.75rem;
`;

const ChildrenWrapper = styled.div`
  padding: 1.2rem;
  z-index: 1;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  z-index: 1;
`;

const Chart = ({ data }: ChartProps) => {
  const theme = useTheme();
  const height = 180;
  const width = 500;
  const baseLevel = 116;
  const path = useMemo(() => {
    const max = Math.max(...data);

    return (
      `M0 ${baseLevel}` +
      data
        .map(
          (val, i) =>
            `L${(width / data.length) * i} ${
              ((height - baseLevel) / 100) * ((val / max) * 100)
            }`
        )
        .join(" ") +
      ` L${width} ${baseLevel} Z`
    );
  }, [data]);

  return (
    <ChartSvg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask id="path-1-inside-1_246_144" fill="white">
        <path d={path} />
      </mask>
      <path
        d={path}
        fill={`rgb(${theme.theme})`}
        stroke={`rgb(${theme.theme})`}
        strokeWidth="2"
        mask="url(#path-1-inside-1_246_144)"
      />
      <rect y="115" width={width} height="100" fill={`rgb(${theme.theme})`} />
    </ChartSvg>
  );
};

const ChartSvg = styled.svg`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: -1;
`;

export const GraphText = styled(Text)`
  line-height: 1em;
  color: #fff;

  span {
    font-size: 0.6em;
  }
`;

interface ChartProps {
  data: number[];
}
