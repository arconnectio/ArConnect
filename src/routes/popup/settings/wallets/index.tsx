import { concatGatewayURL } from "~gateways/utils";
import { ButtonV2, Spacer, useInput } from "@arconnect/components";
import { useEffect, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { ExtensionStorage } from "~utils/storage";
import { useLocation } from "wouter";
import type { StoredWallet } from "~wallets";
import { Reorder } from "framer-motion";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useGateway } from "~gateways/wayfinder";
import WalletListItem from "~components/dashboard/list/WalletListItem";
import SearchInput from "~components/dashboard/SearchInput";
import HeadV2 from "~components/popup/HeadV2";

export default function Wallets() {
  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const [, setLocation] = useLocation();

  // ans data
  const [ansProfiles, setAnsProfiles] = useState<AnsUser[]>([]);

  useEffect(() => {
    (async () => {
      if (!wallets) return;

      // fetch profiles
      const profiles = await getAnsProfile(wallets.map((w) => w.address));

      setAnsProfiles(profiles as AnsUser[]);
    })();
  }, [wallets]);

  // ans shortcuts
  const findProfile = (address: string) =>
    ansProfiles.find((profile) => profile.user === address);

  const gateway = useGateway({ startBlock: 0 });

  function findAvatar(address: string) {
    const avatar = findProfile(address)?.avatar;
    const gatewayUrl = concatGatewayURL(gateway);

    if (!avatar) return undefined;
    return gatewayUrl + "/" + avatar;
  }

  function findLabel(address: string) {
    const label = findProfile(address)?.currentLabel;

    if (!label) return undefined;
    return label + ".ar";
  }

  // search
  const searchInput = useInput();

  // search filter function
  function filterSearchResults(wallet: StoredWallet) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      wallet.address.toLowerCase().includes(query.toLowerCase()) ||
      wallet.nickname.toLowerCase().includes(query.toLowerCase()) ||
      findLabel(wallet.address)?.includes(query.toLowerCase())
    );
  }

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("setting_wallets")}
        back={() => setLocation("/quick-settings")}
      />
      <Wrapper>
        <div style={{ height: "100%" }}>
          <SearchInput
            placeholder={browser.i18n.getMessage("search_wallets")}
            {...searchInput.bindings}
          />
          <Spacer y={1} />
          {wallets && (
            <WalletsWrapper>
              <Reorder.Group
                as="div"
                axis="y"
                onReorder={setWallets}
                values={wallets}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem"
                }}
              >
                {wallets.filter(filterSearchResults).map((wallet) => (
                  <WalletListItem
                    small={true}
                    wallet={wallet}
                    name={findLabel(wallet.address) || wallet.nickname}
                    address={wallet.address}
                    avatar={findAvatar(wallet.address)}
                    active={false}
                    onClick={() =>
                      setLocation("/quick-settings/wallets/" + wallet.address)
                    }
                    key={wallet.address}
                  />
                ))}
              </Reorder.Group>
            </WalletsWrapper>
          )}
        </div>

        <ActionBar>
          <ButtonV2
            fullWidth
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL("tabs/dashboard.html#/wallets/new")
              })
            }
          >
            {browser.i18n.getMessage("add_wallet")}
          </ButtonV2>
        </ActionBar>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 10px);
`;

const WalletsWrapper = styled.div`
  max-height: 80vh;
  overflow-y: auto;
  padding: 0;

  /* Hide Scrollbar */
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */
  &::-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
  }
`;

const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  background-color: rgb(${(props) => props.theme.background});
`;
