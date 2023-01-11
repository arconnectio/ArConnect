import type { JWKInterface } from "arweave/node/lib/wallet";
import { Spacer, Text } from "@arconnect/components";
import { useWalletsDetails } from "~wallets/hooks";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Wallet from "./Wallet";

export default function Migrate({ wallets }: Props) {
  const walletDetails = useWalletsDetails(wallets);

  return (
    <>
      <Spacer y={1.2} />
      <Title>{browser.i18n.getMessage("migrate_wallets_list")}</Title>
      <Spacer y={0.6} />
      <Wallets>
        {walletDetails.map((wallet, i) => (
          <Wallet address={wallet.address} label={wallet.label} key={i} />
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

export interface WalletInterface {
  address: string;
  label?: string;
}

interface Props {
  wallets: JWKInterface[];
}
