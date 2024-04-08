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
import { LockIcon } from "@iconicicons/react";

interface Props {
  vaultName: string;
  vaultAddress: string;
  initial?: boolean;
}

export default function VaultSettings({
  initial = false,
  vaultName,
  vaultAddress
}: Props) {
  const [activeAddress, setActiveAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const [walletItems, setWalletItems] = useState<React.ReactNode[]>([]);
  const [vaultBalance, setVaultBalance] = useState<number>(0);

  useEffect(() => {
    const loadWallets = async () => {
      if (!wallets) return;

      const walletPromises = wallets.map(async (wallet) => {
        const gateway = await findGateway({});
        const arweave = new Arweave(gateway);
        const balance =
          arweave.ar.winstonToAr(
            await arweave.wallets.getBalance(wallet.address)
          ) || 0;
        const svgieAvatar = svgie(wallet.address, { asDataURI: true });
        return (
          <ListItem
            key={wallet.address}
            title={`${wallet.nickname} (${formatAddress(wallet.address, 3)})`}
            description={`${formatTokenBalance(balance)} AR`}
            active={false}
            onClick={() => {
              // Switch active accounts
              setActiveAddress(wallet.address);
              browser.tabs.create({
                url: browser.runtime.getURL(
                  `popup.html?expanded=true#/send/transfer/AR/${vaultAddress}`
                )
              });
            }}
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
  //
  useEffect(() => {
    // load balance here
    const loadBalance = async () => {
      const gateway = await findGateway({});
      const arweave = new Arweave(gateway);
      const balance =
        arweave.ar.winstonToAr(
          await arweave.wallets.getBalance(vaultAddress)
        ) || 0;
      setVaultBalance(Number(balance));
      try {
      } catch (err) {}
    };
    loadBalance();
  }, []);

  return (
    <Wrapper>
      <Rewards alt />
      {vaultBalance <= 0 ? (
        <>
          <Title style={{ margin: "0" }}>
            {browser.i18n.getMessage("vault_onboard_message", [vaultName])}
          </Title>
          <WarningWrapper>
            <VaultInfo>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <AlertCircle />
                {browser.i18n.getMessage("initial_vault_transfer_note")}
              </span>
            </VaultInfo>
          </WarningWrapper>
          <WalletWrapper>{walletItems}</WalletWrapper>
          <ButtonV2 secondary fullWidth>
            {browser.i18n.getMessage("other_wallet")}
          </ButtonV2>
        </>
      ) : (
        <HasBalance />
      )}
      <Title style={{ paddingTop: "14px" }}>
        {browser.i18n.getMessage("vault_view")}
      </Title>
      <ButtonV2 style={{ marginBottom: "32px" }} fullWidth>
        {browser.i18n.getMessage("vault_home")}
      </ButtonV2>
      {vaultBalance <= 0 && (
        <WarningWrapper>
          <VaultInfo>
            <h3>{browser.i18n.getMessage("vault_created_successfully")}</h3>
            <p>{browser.i18n.getMessage("vault_description")}</p>
            {/* TODO: Redirect to blog here */}
            <a href="">{browser.i18n.getMessage("learn_more")}</a>
          </VaultInfo>
        </WarningWrapper>
      )}
    </Wrapper>
  );
}

const HasBalance = () => {
  return (
    <WarningWrapper>
      <VaultInfo>
        <div
          style={{
            display: "flex",
            alignItems: "center"
          }}
        >
          <LockIcon />
          <h3>{browser.i18n.getMessage("vault_locked")}</h3>
        </div>
        <p>{browser.i18n.getMessage("vault_locked_description")}</p>
        <p style={{ paddingBottom: "11px" }}>
          {browser.i18n.getMessage("create_new_vault_description")}
        </p>
        <ButtonV2
          fullWidth
          onClick={() =>
            (window.location.href = browser.runtime.getURL(
              "tabs/dashboard.html#/vaults/new"
            ))
          }
        >
          {browser.i18n.getMessage("create_new_vault")}
        </ButtonV2>
      </VaultInfo>
    </WarningWrapper>
  );
};

const Title = styled(Text)`
  margin: 0;
  color: ${(props) => props.theme.primaryTextv2};
`;

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
  padding: 18px 0;
  gap: 18px;
  justify-content: space-between;
`;
