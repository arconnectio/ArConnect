import styled from "styled-components";
type PaginationProps = {
  status: "completed" | "active" | "future";
  bar: "leftHidden" | "rightHidden" | "none";
  title: string;
};

const Pagination: React.FC<PaginationProps> = ({ status, bar, title }) => (
  <Wrapper>
    {/* Completed */}
    <StepWrapper>
      <FlexContainer>
        <LineWrapper>
          <Line hidden={bar === "leftHidden"} />
        </LineWrapper>
        <Circle status={status}>
          <CheckIcon />
        </Circle>
        <LineWrapper>
          <Line roundedEnd="left" hidden={bar === "rightHidden"} />
        </LineWrapper>
      </FlexContainer>
      {title}
    </StepWrapper>
  </Wrapper>
);

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
  width: 100;
  height: 2px;
  ${(props) => {
    switch (props.roundedEnd) {
      case "left":
        return `
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
        `;
      case "right":
        return `
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        `;
      default:
        return "";
    }
  }}
  background-color: rgba(171, 154, 255, 0.7);
`;

const StepWrapper = styled.div`
  display: flex;
  width: 72px;
  flex-direction: column;
  align-items: center;
  color: #aeadcd;
  font-size: 10px;
`;

const Step = styled.p`
  font-size: 8px;
`;
const FlexContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center; // This will center the items
  align-items: center;
  width: 100%; // Ensures the flex container takes up the full width of StepWrapper
`;

const Wrapper = styled.div`
  display: flex;
`;

const Circle = styled.div<{
  secondary?: boolean;
  status?: string;
}>`
  width: 20px;
  height: 20px;
  background-color: ${(props) =>
    props.status === "active" ? "#AB9AFF" : "#EBEBF1"};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  ${(props) =>
    props.secondary &&
    `
    ::before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      border: 1px solid #ab9aff; 
      border-radius: 50%;
    }
  `}
`;
export default Pagination;
