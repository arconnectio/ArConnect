import { ButtonV2, Checkbox, Spacer, Text } from "@arconnect/components";
import { PageType, isUserInGDPRCountry, trackPage } from "~utils/analytics";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import JSConfetti from "js-confetti";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Done() {
  // analytics opt-in
  const [analytics, setAnalytics] = useSetting<boolean>("analytics");
  const [gdpr, setGdpr] = useState<boolean>(null);
  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });
  const [, setLocation] = useLocation();

  // finalize
  async function done() {
    if (!analytics && !answered) {
      await setAnswered(true);
      await setAnalytics(false);
    }

    // redirect to getting started pages
    setLocation("/getting-started/1");
  }

  // determine location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const loc = await isUserInGDPRCountry();
        setGdpr(loc);
      } catch (err) {
        console.error(err);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (gdpr !== null) {
      const val = !gdpr;
      setAnalytics(gdpr);
    }
  }, [gdpr]);

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_COMPLETE);
  }, []);

  // confetti
  useEffect(() => {
    const jsConfetti = new JSConfetti();

    jsConfetti.addConfetti();
  }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("all_set")}</Text>
      <Paragraph>{browser.i18n.getMessage("all_set_paragraph")}</Paragraph>
      <Checkbox
        checked={!!analytics}
        onChange={async (checked) => {
          await setAnalytics(checked);
          await setAnswered(true);
        }}
      >
        {browser.i18n.getMessage("analytics_title")}
      </Checkbox>
      <Spacer y={1.5} />
      <ButtonV2 fullWidth onClick={done}>
        {browser.i18n.getMessage("done")}
      </ButtonV2>
    </>
  );
}
