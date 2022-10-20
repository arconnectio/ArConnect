import { Spacer, useInput } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { SettingsList } from "./list/BaseElement";
import { useLocation, useRoute } from "wouter";
import type { StoredWallet } from "~wallets";
import { useEffect, useMemo } from "react";
import WalletListItem from "./list/WalletListItem";
import SearchInput from "./SearchInput";
import styled from "styled-components";

export default function Wallets() {
  // wallets
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
    },
    []
  );

  // router
  const [, params] = useRoute<{ address?: string }>("/wallets/:address?");
  const [, setLocation] = useLocation();

  // active subsetting val
  const activeWalletSetting = useMemo(
    () => (params?.address ? params.address : undefined),
    [params]
  );

  useEffect(() => {
    const firstWallet = wallets?.[0];

    if (
      !firstWallet ||
      (!!activeWalletSetting &&
        !!wallets.find((w) => w.address == activeWalletSetting))
    ) {
      return;
    }

    setLocation("/wallets/" + firstWallet);
  }, [wallets]);

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
      wallet.nickname.toLowerCase().includes(query.toLowerCase())
    );
  }

  return (
    <Wrapper>
      <SearchInput
        placeholder="Search for a wallet..."
        {...searchInput.bindings}
        sticky
      />
      <Spacer y={1} />
      <SettingsList>
        {wallets &&
          wallets.filter(filterSearchResults).map((wallet, i) => (
            <WalletListItem
              name={wallet.nickname}
              address={wallet.address}
              //avatar={app.icon}
              active={activeWalletSetting === wallet.address}
              onClick={() => setLocation("/wallets/" + wallet.address)}
              key={i}
            />
          ))}
      </SettingsList>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
