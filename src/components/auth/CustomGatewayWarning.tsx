import { WarningTriangleIcon } from "@iconicicons/react";
import { motion, Variants } from "framer-motion";
import { Section } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function CustomGatewayWarning() {
  return (
    <motion.div
      variants={animation}
      initial="hidden"
      animate="shown"
      exit="hidden"
    >
      <Section>
        <Alert>
          <Icon />
          {browser.i18n.getMessage("custom_gateway_warning")}
        </Alert>
      </Section>
    </motion.div>
  );
}

const Alert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #ffb800;
  font-weight: 500;
  font-size: 1rem;
  background-color: rgb(255, 184, 0, 0.2);
  padding: 0.9rem 1rem;
  border-radius: 19px;
`;

const Icon = styled(WarningTriangleIcon)`
  width: 40px;
  height: 40px;
`;

const animation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};
