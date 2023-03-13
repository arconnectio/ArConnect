import { AnimatePresence, Variants, motion } from "framer-motion";
import { Card, Spacer } from "@arconnect/components";
import { useRoute } from "wouter";
import { useMemo } from "react";
import styled from "styled-components";

import GenerateDone from "./generate/done";
import Confirm from "./generate/confirm";
import Backup from "./generate/backup";

import Password from "./load/password";
import Wallets from "./load/wallets";
import LoadDone from "./load/done";
import Theme from "./load/theme";

/** Prefix for setup storage */
export const SETUP_PREFIX = "setup_";

/** Wallet generate pages */
const generatePages = [
  <Password />,
  <Backup />,
  <Confirm />,
  <Theme />,
  <GenerateDone />
];

/** Wallet load pages */
const loadPages = [<Password />, <Wallets />, <Theme />, <LoadDone />];

export default function Setup() {
  // get if the route is the load wallet route
  const [isLoadPage, params] = useRoute<{ page?: string }>("/load/:page");

  // load or generate wallet
  const setupMode = useMemo<SetupMode>(
    () => (isLoadPage ? "load" : "generate"),
    [isLoadPage]
  );

  // page index
  const page = useMemo(() => {
    if (!params?.page) return 0;
    return Number(params.page) - 1;
  }, [params]);

  return (
    <Wrapper>
      <SetupCard>
        <Paginator>
          {Array(4)
            .fill("")
            .map((_, i) => (
              <Page key={i} active={page === i + 1} />
            ))}
        </Paginator>
        <Spacer y={1} />
        <AnimatePresence initial={false}>
          <motion.div
            variants={pageAnimation}
            initial="exit"
            animate="init"
            key={page}
          >
            {(setupMode === "load" ? loadPages : generatePages)[page]}
          </motion.div>
        </AnimatePresence>
      </SetupCard>
    </Wrapper>
  );
}

type SetupMode = "load" | "generate";

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const SetupCard = styled(Card)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 350px;
  transform: translate(-50%, -50%);
`;

const Paginator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
`;

const Page = styled.div<{ active?: boolean }>`
  width: 2.5rem;
  height: 2px;
  background-color: rgba(
    ${(props) => props.theme.theme + ", " + (props.active ? "1" : ".45")}
  );
  transition: all 0.23s ease-in-out;
`;

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};
