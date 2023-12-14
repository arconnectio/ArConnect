import { AnimatePresence, motion, type Variants } from "framer-motion";
import { type HistoryAction, useHistory } from "~utils/hash_router";
import { createElement, type PropsWithChildren } from "react";
import { useRoute, Route as BaseRoute } from "wouter";
import styled from "styled-components";

/**
 * Custom Route component that allows iOS-like animations
 */
const Route: typeof BaseRoute = ({ path, component, children }) => {
  const [matches, params] = useRoute(path);
  const routeContent = component
    ? createElement(component, { params })
    : typeof children === "function"
    ? children(params)
    : children;

  const [, _, action] = useHistory();

  return (
    <AnimatePresence initial={false}>
      {matches && <Page action={action}>{routeContent}</Page>}
    </AnimatePresence>
  );
};

export const Wrapper = styled(motion.div)<{ responsive?: boolean }>`
  position: relative;
  width: ${(props) => (props.responsive ? "100%" : "377.5px")};
  min-height: 600px;
`;

const PageWrapper = styled(Wrapper)`
  position: absolute;
  padding: 0 0 79px 0;
  top: 0;
  width: 100%;
  background-color: rgb(${(props) => props.theme.background});
  transition: background-color 0.23s ease-in-out;
`;

const Page = ({
  children,
  action
}: PropsWithChildren<{ action: HistoryAction }>) => {
  const transition = { ease: [0.42, 0, 0.58, 1], duration: 0.27 };
  const pageAnimation: Variants = {
    enter: {
      x: 0,
      transition,
      ...(action === "push"
        ? {
            right: 0,
            left: 0,
            bottom: 0
          }
        : {})
    },
    initial: {
      x: action === "push" ? "100%" : "-25%",
      transition,
      ...(action === "push"
        ? {
            right: 0,
            left: 0,
            bottom: 0
          }
        : {})
    },
    exit: {
      x: action === "pop" ? "100%" : "-10%",
      zIndex: action === "pop" ? 1 : -1,
      transition,
      ...(action === "pop"
        ? {
            right: 0,
            left: 0,
            bottom: 0
          }
        : {})
    }
  };

  return (
    <PageWrapper
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageAnimation}
    >
      {children}
    </PageWrapper>
  );
};

export default Route;
