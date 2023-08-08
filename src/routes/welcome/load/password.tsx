import PasswordStrength from "../../../components/welcome/PasswordStrength";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { checkPasswordValid } from "~wallets/generator";
import { ArrowRightIcon } from "@iconicicons/react";
import { useLocation, useRoute } from "wouter";
import Paragraph from "~components/Paragraph";
import { useContext, useMemo } from "react";
import browser from "webextension-polyfill";
import { PasswordContext } from "../setup";
import styled from "styled-components";
import {
  Button,
  Input,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";

export default function Password() {
  // input controls
  const passwordInput = useInput();
  const validPasswordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // password context
  const { setPassword } = useContext(PasswordContext);

  // route
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");
  const [, setLocation] = useLocation();

  // handle done button
  function done() {
    // check if passwords match
    if (passwordInput.state !== validPasswordInput.state) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("passwords_not_match"),
        duration: 2300
      });
    }

    // check password validity
    if (!checkPasswordValid(passwordInput.state)) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("password_not_strong"),
        duration: 2300
      });
    }

    // set password in global context
    setPassword(passwordInput.state);

    // next page
    setLocation(`/${params.setup}/${Number(params.page) + 1}`);
  }

  // passwords match
  const matches = useMemo(
    () => passwordInput.state === validPasswordInput.state,
    [passwordInput, validPasswordInput]
  );

  // password valid
  const validPassword = useMemo(
    () => checkPasswordValid(passwordInput.state),
    [passwordInput]
  );

  return (
    <>
      <Text heading>{browser.i18n.getMessage("create_password")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("create_password_paragraph")}
      </Paragraph>
      <Input
        type="password"
        {...passwordInput.bindings}
        placeholder={browser.i18n.getMessage("enter_password")}
        fullWidth
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          done();
        }}
      />
      <Spacer y={1} />
      <Input
        type="password"
        {...validPasswordInput.bindings}
        placeholder={browser.i18n.getMessage("enter_password_again")}
        fullWidth
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          done();
        }}
      />
      <AnimatePresence>
        {validPassword && matches && (
          <motion.div
            initial="hidden"
            animate="shown"
            exit="hidden"
            variants={opacityAnimation}
          >
            <Spacer y={0.65} />
            <MatchIndicator>
              {browser.i18n.getMessage("passwords_match")}
            </MatchIndicator>
          </motion.div>
        )}
      </AnimatePresence>
      <Spacer y={(validPassword && matches && 1.15) || 1.55} />
      <PasswordStrength password={passwordInput.state} />
      <Spacer y={1} />
      <Button fullWidth onClick={done}>
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon />
      </Button>
    </>
  );
}

const MatchIndicator = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(0, 255, 0);
  font-size: 0.84rem;
`;

const opacityAnimation: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  shown: {
    opacity: 1,
    height: "auto"
  }
};
