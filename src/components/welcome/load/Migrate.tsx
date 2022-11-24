import type { JWKInterface } from "@arconnect/arweave/node/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { WalletIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import { Spacer, Text } from "@arconnect/components";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Arweave from "arweave";

export default function Migrate({ wallets }: Props) {
  const [walletDetails, setWalletDetails] = useState<WalletInterface[]>([]);

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const details: WalletInterface[] = [];

      // load wallet addresses
      for (const wallet of wallets) {
        const address = await arweave.wallets.getAddress(wallet);

        details.push({ address });
      }

      // load ans labels
      const profiles = (await getAnsProfile(
        details.map((w) => w.address)
      )) as AnsUser[];

      for (const wallet of details) {
        const profile = profiles.find((p) => p.user === wallet.address);

        if (!profile?.currentLabel) continue;
        wallet.label = profile.currentLabel + ".ar";
      }

      // set details
      setWalletDetails(details);
    })();
  }, [wallets]);

  return (
    <>
      <Spacer y={1.2} />
      <Title>{browser.i18n.getMessage("migrate_wallets_list")}</Title>
      <Spacer y={0.6} />
      <Wallets>
        {walletDetails.map((wallet, i) => (
          <Wallet key={i}>
            <Icon />
            {formatAddress(wallet.address, 8)}
            {wallet.label && ` (${wallet.label})`}
          </Wallet>
        ))}
      </Wallets>
    </>
  );
}

const Title = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.theme});
`;

const Wallets = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
`;

const Wallet = styled.div`
  display: flex;
  align-items: center;
  gap: 0.43rem;
  font-size: 0.92rem;
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
`;

const Icon = styled(WalletIcon)`
  font-size: 1.08rem;
  width: 1em;
  height: 1em;
`;

interface WalletInterface {
  address: string;
  label?: string;
}

interface Props {
  wallets: JWKInterface[];
}
