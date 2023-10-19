import type { DisplayTheme } from "@arconnect/components";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { useTheme } from "~utils/theme";

export enum Status {
  COMPLETED = "completed",
  ACTIVE = "active",
  FUTURE = "future"
}

type PaginationProps = {
  status: Status;
  hidden: "leftHidden" | "rightHidden" | "none";
  title: string;
  index: number;
};

const Pagination: React.FC<PaginationProps> = ({
  status,
  hidden,
  title,
  index
}) => {
  const theme = useTheme();

  return (
    <StepWrapper>
      <FlexContainer>
        <LineWrapper>
          <Line hidden={hidden === "leftHidden"} roundedEnd="right" />
        </LineWrapper>
        <Circle status={status} displayTheme={theme}>
          {status === Status.ACTIVE || status === Status.FUTURE ? (
            index
          ) : (
            <CheckIcon />
          )}
        </Circle>
        <LineWrapper>
          <Line roundedEnd="left" hidden={hidden === "rightHidden"} />
        </LineWrapper>
      </FlexContainer>
      {browser.i18n.getMessage(title)}
    </StepWrapper>
  );
};

const CheckIcon = () => (
  <svg
    width="11"
    height="8"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.67794 6.31171L1.30728 3.82401L0.5 4.66517L3.67794 8L10.5 0.841163L9.69841 0L3.67794 6.31171Z"
      fill="white"
    />
  </svg>
);

const LineWrapper = styled.div`
  flex: 1;
`;

const Line = styled.div<{ roundedEnd?: "left" | "right"; hidden?: boolean }>`
  display: ${(props) => props.hidden && "none"};
  height: 0.125rem;
  ${(props) => {
    switch (props.roundedEnd) {
      case "left":
        return `
          border-top-left-radius: 0.625rem;
          border-bottom-left-radius: 0.625rem;
        `;
      case "right":
        return `
          border-top-right-radius: 0.625rem;
          border-bottom-right-radius: 0.625rem;
        `;
      default:
        return "";
    }
  }}
  background-color: rgba(171, 154, 255, 0.7);
`;

const StepWrapper = styled.div`
  display: flex;
  width: 4.5rem;
  flex-direction: column;
  align-items: center;
  color: #aeadcd;
  font-size: 0.75rem;
`;

const FlexContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Circle = styled.div<{
  status?: Status;
  displayTheme: DisplayTheme;
}>`
  width: 1.25rem;
  height: 1.25rem;
  background-color: ${(props) => {
    switch (props.status) {
      case Status.ACTIVE:
        return props.displayTheme === "light"
          ? "#EBEBF1"
          : "rgba(171, 154, 255, 0.15)";
      case Status.COMPLETED:
        return "#AB9AFF";
      case Status.FUTURE:
        return props.displayTheme === "light" ? "#FFFFFF" : "none";
      default:
        return "#FFFFFF";
    }
  }};
  font-size: 0.625rem;
  color: ${(props) => (props.displayTheme === "light" ? "#000" : "#EBEBF1")};
  transition: all 0.23s ease-in-out;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  ${(props) =>
    props.status !== Status.COMPLETED &&
    `
    ::before {
      content: "";
      position: absolute;
      width: 1.125rem;
      height: 1.125rem;
      border: 1px solid #ab9aff; 
      border-radius: 50%;
    }
  `}
`;
export default Pagination;
