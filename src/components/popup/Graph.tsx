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

  // graph dimensions
  const height = 180;
  const width = 500;

  // where the graph drawing starts from
  const baseLevel = 101;

  const path = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);

    return (
      `M0 ${baseLevel}` +
      data
        .map((val, i) => {
          // vertical pos
          // we calculate it like this:
          // 1. Subtract the minimum value from the val & max
          // 2. Get the ratio of the value / max element of the dataset
          // 3. Get the pixel size of 1% of the graph height
          // 4. Multiply the calculated ratio with the 1% size
          const v =
            ((val - min) / (max - min)) * 100 * ((height - baseLevel) / 100);

          // horizontal pos
          // we calculate it by dividing it with our data size to
          // split the total length into sections of equal width
          const h = (width / (data.length - 1)) * i;

          return "L" + h + " " + v;
        })
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
      <rect
        y={baseLevel - 1}
        width={width}
        height="115"
        fill={`rgb(${theme.theme})`}
      />
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
