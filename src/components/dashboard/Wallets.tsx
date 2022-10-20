import { Spacer, useInput } from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { SettingsList } from "./list/BaseElement";
import { useLocation, useRoute } from "wouter";
import type { StoredWallet } from "~wallets";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";
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

    setLocation("/wallets/" + firstWallet.address);
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

  function findAvatar(address: string) {
    const avatar = findProfile(address)?.avatar;
    const gatewayUrl = concatGatewayURL(defaultGateway);

    if (!avatar) return undefined;
    return gatewayUrl + "/" + avatar;
  }

  function findLabel(address: string) {
    const label = findProfile(address)?.currentLabel;

    if (!label) return undefined;
    return label + ".ar";
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
          wallets
            .filter(filterSearchResults)
            .map((wallet, i) => (
              <WalletListItem
                name={findLabel(wallet.address) || wallet.nickname}
                address={wallet.address}
                avatar={findAvatar(wallet.address)}
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
