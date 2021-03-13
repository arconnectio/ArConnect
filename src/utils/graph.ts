export function GraphOptions({
  ticks = false,
  tooltipText,
  tickText
}: IGraphOptions) {
  const jetbrainsMono = '"JetBrainsMono", monospace',
    jetbrainsFontStyle = {
      fontFamily: jetbrainsMono,
      fontSize: 12
    };

  return {
    elements: {
      point: { radius: 0 },
      line: {
        borderWidth: 5,
        borderCapStyle: "round"
      }
    },
    layout: {
      padding: {
        top: 12
      }
    },
    tooltips: {
      mode: "index",
      intersect: false,
      titleFontFamily: jetbrainsMono,
      bodyFontFamily: jetbrainsMono,
      callbacks: {
        label: tooltipText ?? (({ value }: any) => value)
      }
    },
    hover: { mode: "nearest", intersect: true },
    legend: { display: false },
    scales: {
      xAxes: [
        {
          ticks: {
            display: ticks,
            ...jetbrainsFontStyle
          },
          gridLines: { display: false }
        }
      ],
      yAxes: [
        {
          ticks: {
            display: ticks,
            ...jetbrainsFontStyle,
            callback: tickText ?? ((val) => val)
          },
          scaleLabel: { display: false },
          gridLines: { display: false }
        }
      ]
    }
  };
}

export const GraphDataConfig = {
  backgroundColor: "rgba(230, 152, 232, .2)",
  borderColor(context: any) {
    let gradient = context.chart.ctx.createLinearGradient(
      0,
      0,
      context.chart.width,
      context.chart.height
    );

    gradient.addColorStop(0, "#E698E8");
    gradient.addColorStop(1, "#8D5FBC");

    return gradient;
  },
  fill: false
};

interface IGraphOptions {
  ticks?: boolean;
  tooltipText?: (tooltipItem?: any) => string;
  tickText?: (value: string, index: number) => string;
}
