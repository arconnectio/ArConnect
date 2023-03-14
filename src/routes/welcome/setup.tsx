import { AnimatePresence, Variants, motion } from "framer-motion";
import { createContext, useEffect, useMemo, useState } from "react";
import { Card, Spacer } from "@arconnect/components";
import { useLocation } from "wouter";
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

export default function Setup({ setupMode, page }: Props) {
  // location
  const [, setLocation] = useLocation();

  // total page count
  const pageCount = useMemo(
    () => (setupMode === "load" ? loadPages : generatePages).length,
    [setupMode]
  );

  // redirect if not on a page
  useEffect(() => {
    // wrong setup mode
    if (Number.isNaN(page) || page < 1 || page > pageCount) {
      setLocation(`/${setupMode}/1`);
    }
  }, [setupMode, page]);

  // temporarily stored password
  const [password, setPassword] = useState("");

  return (
    <Wrapper>
      <SetupCard>
        <Paginator>
          {Array(pageCount)
            .fill("")
            .map((_, i) => (
              <Page key={i} active={page === i + 1} />
            ))}
        </Paginator>
        <Spacer y={1} />
        <PasswordContext.Provider value={{ password, setPassword }}>
          <AnimatePresence initial={false}>
            <motion.div
              variants={pageAnimation}
              initial="exit"
              animate="init"
              key={page}
            >
              {(setupMode === "load" ? loadPages : generatePages)[page - 1]}
            </motion.div>
          </AnimatePresence>
        </PasswordContext.Provider>
      </SetupCard>
    </Wrapper>
  );
}

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

export const PasswordContext = createContext({
  setPassword: (password: string) => {},
  password: ""
});

interface Props {
  setupMode: "generate" | "load";
  page: number;
}
