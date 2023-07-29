import { Button, Spacer, Text } from "@arconnect/components";
import { PasswordContext, WalletContext } from "../setup";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { formatAddress } from "~utils/format";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import { addWallet } from "~wallets";
import { useContext } from "react";

export default function Done() {
  // wallet context
  const wallet = useContext(WalletContext);

  // password
  const { password } = useContext(PasswordContext);

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

    // close window
    window.top.close();
  }

  return (
    <>
      <Text heading>{browser.i18n.getMessage("setup_complete_title")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("generated_wallet", [
          formatAddress(wallet.address || "", 6)
        ])}
      </Paragraph>
      <Spacer y={3} />
      <Button fullWidth onClick={done}>
        {browser.i18n.getMessage("done")}
      </Button>
    </>
  );
}
