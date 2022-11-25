import { motion, Variants } from "framer-motion";
import { Loading } from "@arconnect/components";
import styled from "styled-components";

const TokenLoading = () => (
  <LoadingWrapper
    variants={opacityAnimation}
    initial="hidden"
    animate="shown"
    exit="hidden"
  >
    <Spinner />
  </LoadingWrapper>
);

const Spinner = styled(Loading)`
  font-size: 1.2rem;
  color: rgb(${(props) => props.theme.theme});
`;

const LoadingWrapper = styled(motion.div)`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 100;
`;

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

export default TokenLoading;
