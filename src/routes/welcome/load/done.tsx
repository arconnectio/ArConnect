import { Button, Checkbox, Spacer, Text } from "@arconnect/components";
import { PageType, trackPage } from "~utils/analytics";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import JSConfetti from "js-confetti";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Done() {
  // analytics opt-in
  const [analytics, setAnalytics] = useSetting<boolean>("analytics");
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

  // Segment
  useEffect(() => {
    (async () => {
      try {
        const currentDate = new Date();
        currentDate.setDate(1);
        const beginningOfMonthTimestamp = currentDate.getTime();
        const balance = beginningOfMonthTimestamp;

        await ExtensionStorage.set("monthly", balance);
        trackPage(PageType.ONBOARD_COMPLETE);
      } catch (error) {
        console.error("err", error);
      }
    })();
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
        onChange={(checked) => {
          setAnalytics(checked);
          setAnswered(true);
        }}
      >
        {browser.i18n.getMessage("analytics_title")}
      </Checkbox>
      <Spacer y={1.5} />
      <Button fullWidth onClick={done}>
        {browser.i18n.getMessage("done")}
      </Button>
    </>
  );
}
