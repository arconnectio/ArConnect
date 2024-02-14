import { Button, type DisplayTheme } from "@arconnect/components";
import { CloseIcon } from "@iconicicons/react";
import styled, { useTheme } from "styled-components";
import { SendInput } from "~routes/popup/send";

interface SliderMenuProps {
  title: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

export default function SliderMenu({
  children,
  title,
  onClose
}: SliderMenuProps) {
  const theme = useTheme();
  return (
    <Wrapper displayTheme={theme.displayTheme}>
      <Body>
        <Header>
          <Title>{title}</Title>
          <ExitButton onClick={onClose} />
        </Header>
        {children}
      </Body>
    </Wrapper>
  );
}

const ExitButton = styled(CloseIcon)`
  cursor: pointer;
`;

const Wrapper = styled.div<{ displayTheme: DisplayTheme }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 62px;
  width: 100%;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "#191919"};
`;

const Body = styled.div`
  padding: 1.0925rem;
  display: flex;
  gap: 15px;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const Title = styled.h2`
  margin: 0;
  padding: 0;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;
