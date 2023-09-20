import { Button, Checkbox, Spacer, Text } from "@arconnect/components";
import { PasswordContext, WalletContext } from "../setup";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { formatAddress } from "~utils/format";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import { addWallet } from "~wallets";
import { useContext, useEffect } from "react";
import { EventType, PageType, trackEvent, trackPage } from "~utils/analytics";
import useSetting from "~settings/hook";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";

export default function Done() {
  // wallet context
  const wallet = useContext(WalletContext);

  // password
  const { password } = useContext(PasswordContext);
  const [analytics, setAnalytics] = useSetting<boolean>("analytics");
  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });

  // add generated wallet
  async function done() {
    // add wallet
    let nickname: string;

    if (!wallet.address || !wallet.jwk) return;

    try {
      const ansProfile = (await getAnsProfile(wallet.address)) as AnsUser;

      if (ansProfile) {
        nickname = ansProfile.currentLabel;
      }
    } catch {}

    // add the wallet
    await addWallet(
      nickname ? { nickname, wallet: wallet.jwk } : wallet.jwk,
      password
    );

    // log user onboarded
    await trackEvent(EventType.ONBOARDED, {});

    if (!analytics && !answered) {
      await setAnswered(true);
      await setAnalytics(false);
    }

    // close window
    window.top.close();
  }

  // Segment
  useEffect(() => {
    trackPage(PageType.ONBOARD_COMPLETE);
  }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("setup_complete_title")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("generated_wallet", [
          formatAddress(wallet.address || "", 6)
        ])}
      </Paragraph>
      <Checkbox
        checked={!!analytics}
        onChange={(checked) => {
          setAnalytics(checked);
          setAnswered(true);
        }}
      >
        {browser.i18n.getMessage("analytics_title")}
      </Checkbox>
      <Spacer y={3} />
      <Button fullWidth onClick={done}>
        {browser.i18n.getMessage("done")}
      </Button>
    </>
  );
}
