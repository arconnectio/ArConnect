import { useHashLocation } from "~utils/hash_router";
import { Router, Route } from "wouter";
import styled from "styled-components";

import Home from "~routes/popup";

export default function Popup() {
  return (
    <Page>
      <Router hook={useHashLocation}>
        <Route path="/" component={Home} />
      </Router>
    </Page>
  );
}

const Page = styled.div`
  width: 385px;
`;
