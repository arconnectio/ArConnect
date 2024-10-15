import { AnimatePresence, motion, type Variants } from "framer-motion";
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

  return (
    <AnimatePresence initial={false}>
      {matches && <Page>{routeContent}</Page>}
    </AnimatePresence>
  );
};

export const Wrapper = styled(motion.div)<{
  responsive?: boolean;
  expanded?: boolean;
}>`
  position: relative;
  width: ${(props) => (props.responsive ? "100%" : "377px")};
  min-height: ${(props) => (props.expanded ? "100vh" : "600px")};
  max-height: max-content;
`;

const PageWrapper = styled(Wrapper)`
  position: absolute;
  top: 0;
  width: 100%;
  transition: background-color 0.23s ease-in-out;
`;

const Page = ({ children }: PropsWithChildren) => {
  const opacityAnimation: Variants = {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <PageWrapper
      initial="initial"
      animate="enter"
      exit="exit"
      variants={opacityAnimation}
    >
      {children}
    </PageWrapper>
  );
};

export default Route;
