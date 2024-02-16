import { Button, Input, Spacer, Text } from "@arconnect/components";

import styled from "styled-components";

import { scheduleNotifications } from "~notifications";

export default function Notifications() {
  return (
    <>
      <Wrapper>
        <Button onClick={scheduleNotifications}></Button>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
