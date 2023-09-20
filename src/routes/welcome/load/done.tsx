import { Button, Checkbox, Spacer, Text } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";

export default function Done() {
  // analytics opt-in
  const [analytics, setAnalytics] = useSetting<boolean>("analytics");
  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });

  // finalize
  async function done() {
    if (!analytics && !answered) {
      await setAnswered(true);
      await setAnalytics(false);
    }

    window.top.close();
  }

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_COMPLETE);
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
