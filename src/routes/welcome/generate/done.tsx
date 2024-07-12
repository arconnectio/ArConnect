import { ButtonV2, Checkbox, Spacer, Text } from "@arconnect/components";
import { PasswordContext, WalletContext } from "../setup";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { formatAddress } from "~utils/format";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import { addWallet } from "~wallets";
import { useContext, useEffect, useRef, useState } from "react";
import {
  EventType,
  PageType,
  isUserInGDPRCountry,
  trackEvent,
  trackPage
} from "~utils/analytics";
import useSetting from "~settings/hook";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import JSConfetti from "js-confetti";
import { useLocation } from "wouter";
import { addExpiration } from "~wallets/auth";

export default function Done() {
  // wallet context
  const { wallet } = useContext(WalletContext);
  const walletRef = useRef(wallet);

  // loading
  const [loading, setLoading] = useState(false);

  // wallet generation taking longer
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  const [, setLocation] = useLocation();

  // password
  const { password } = useContext(PasswordContext);
  const [analytics, setAnalytics] = useSetting<boolean>("analytics");
  const [answered, setAnswered] = useStorage<boolean>({
    key: "analytics_consent_answered",
    instance: ExtensionStorage
  });

  // add generated wallet
  async function done() {
    if (loading) return;

    const startTime = Date.now();

    setLoading(true);
    // add wallet
    let nickname: string;

    if (!walletRef.current.address || !walletRef.current.jwk) {
      await new Promise((resolve) => {
        const checkState = setInterval(() => {
          if (walletRef.current.jwk) {
            clearInterval(checkState);
            resolve(null);
          }
          if (!showLongWaitMessage) {
            setShowLongWaitMessage(Date.now() - startTime > 10000);
          }
        }, 1000);
      });
    }

    try {
      const ansProfile = (await getAnsProfile(
        walletRef.current.address
      )) as AnsUser;

      if (ansProfile) {
        nickname = ansProfile.currentLabel;
      }
    } catch {}

    // add the wallet
    await addWallet(
      nickname
        ? { nickname, wallet: walletRef.current.jwk }
        : walletRef.current.jwk,
      password
    );

    // add password expiration
    await addExpiration();

    // log user onboarded
    await trackEvent(EventType.ONBOARDED, {});

    if (!analytics && !answered) {
      await setAnswered(true);
      await setAnalytics(false);
    }

    // redirect to getting started pages
    setLocation("/getting-started/1");

    setShowLongWaitMessage(false);
    setLoading(false);
  }

  useEffect(() => {
    const jsConfetti = new JSConfetti();

    jsConfetti.addConfetti();
  }, []);

  // determine location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const loc = await isUserInGDPRCountry();
        setAnalytics(!loc);
      } catch (err) {
        console.error(err);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

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
        onChange={() => {
          setAnalytics((prev) => !prev);
          setAnswered(true);
        }}
      >
        {browser.i18n.getMessage("analytics_title")}
      </Checkbox>
      <Spacer y={3} />
      <ButtonV2 fullWidth onClick={done} loading={loading}>
        {browser.i18n.getMessage("done")}
      </ButtonV2>
      {loading && showLongWaitMessage && (
        <Text noMargin style={{ textAlign: "center", marginTop: "0.3rem" }}>
          {browser.i18n.getMessage("longer_than_usual")}
        </Text>
      )}
    </>
  );
}
