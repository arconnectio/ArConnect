import { useEffect, useMemo, useState } from "react";
import { type StoredWallet } from "~wallets";
import { Text, ButtonV2, ListItem } from "@arconnect/components";
import browser from "webextension-polyfill";
import Arweave from "arweave/web/common";
import styled from "styled-components";
import Rewards from "~components/popup/home/Rewards";
import { AlertCircle, Lock01 } from "@untitled-ui/icons-react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { svgie } from "~utils/svgies";
import { formatAddress } from "~utils/format";
import { findGateway } from "~gateways/wayfinder";
import { formatTokenBalance } from "~tokens/currency";

interface Props {
  vaultName: string;
  initial?: boolean;
}

export default function VaultSettings({ initial = false, vaultName }: Props) {
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const [walletItems, setWalletItems] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const loadWallets = async () => {
      if (!wallets) return;

      const walletPromises = wallets.map(async (wallet) => {
        const svgieAvatar = svgie(wallet.address, { asDataURI: true });
        const gateway = await findGateway({});
        const arweave = new Arweave(gateway);
        const balance =
          arweave.ar.winstonToAr(
            await arweave.wallets.getBalance(wallet.address)
          ) || 0;
        return (
          <ListItem
            // TODO: Add click handler here
            key={wallet.address}
            title={`${wallet.nickname} (${formatAddress(wallet.address, 3)})`}
            description={`${formatTokenBalance(balance)} AR`}
            active={false}
            RightContent={null}
            img={svgieAvatar}
          />
        );
      });

      const resolvedWallets = await Promise.all(walletPromises);
      setWalletItems(resolvedWallets);
    };

    loadWallets();
  }, [wallets]);

  return (
    <Wrapper>
      <Rewards alt />
      <Text style={{ margin: "0" }}>
        {browser.i18n.getMessage("vault_onboard_message", [vaultName])}
      </Text>
      <WarningWrapper>
        <AlertCircle />
        {browser.i18n.getMessage("initial_vault_transfer_note")}
      </WarningWrapper>
      <WalletWrapper>{walletItems}</WalletWrapper>
      <ButtonV2 secondary fullWidth>
        {browser.i18n.getMessage("other_wallet")}
      </ButtonV2>
      <Text style={{ margin: "0" }}>
        {browser.i18n.getMessage("vault_view")}
      </Text>
      <ButtonV2 style={{ marginBottom: "32px" }} fullWidth>
        {browser.i18n.getMessage("vault_home")}
      </ButtonV2>
      {/* TODO: need to determine how to know if it's intial or not */}
      {/* {!initial ? (
        <WarningWrapper>
          <VaultInfo>
            <h3>{browser.i18n.getMessage("vault_created_successfully")}</h3>
            <p>{browser.i18n.getMessage("vault_description")}</p>
            <a href="">{browser.i18n.getMessage("learn_more")}</a>
          </VaultInfo>
        </WarningWrapper>
        ) : (
          <DeleteVaultButton fullWidth>Remove Vault</DeleteVaultButton>
        )} */}
      <WarningWrapper>
        <VaultInfo>
          <h3>{browser.i18n.getMessage("vault_created_successfully")}</h3>
          <p>{browser.i18n.getMessage("vault_description")}</p>
          {/* TODO: Redirect to blog here */}
          <a href="">{browser.i18n.getMessage("learn_more")}</a>
        </VaultInfo>
      </WarningWrapper>
      <DeleteVaultButton fullWidth>
        {browser.i18n.getMessage("vault_remove")}
      </DeleteVaultButton>
    </Wrapper>
  );
}

const WalletWrapper = styled.div`
  overflow-y: auto;
`;

const WarningWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 1em;
  gap: 7px;
  border: 1.5px solid ${(props) => props.theme.primary};
  background-color: ${(props) => props.theme.backgroundSecondary};
  border-radius: 10px;
`;

const DeleteVaultButton = styled(ButtonV2)`
  background-color: ${(props) => props.theme.delete};
`;

const VaultInfo = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 7px;
  justify-content: center;
  width: 100%;

  h3,
  p {
    text-align: center;
    margin: 0;
  }

  h3 {
    font-size: 14px;
    font-weight: 600;
  }
  a {
    color: ${(props) => props.theme.primary};
    text-decoration: none;
    border: none;
    outline: none;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 14px 0;
  gap: 14px;
  justify-content: space-between;
`;
