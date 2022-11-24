import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { Spacer, useInput } from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "~components/IconButton";
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { SettingsList } from "./list/BaseElement";
import { useLocation, useRoute } from "wouter";
import { PlusIcon } from "@iconicicons/react";
import type { StoredWallet } from "~wallets";
import WalletListItem from "./list/WalletListItem";
import browser from "webextension-polyfill";
import SearchInput from "./SearchInput";
import styled from "styled-components";
import { Reorder } from "framer-motion";

export default function Wallets() {
  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
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

    // return if there is a wallet present in params
    if (
      !firstWallet ||
      (!!activeWalletSetting &&
        !!wallets.find((w) => w.address == activeWalletSetting))
    ) {
      return;
    }

    // return if the new wallet page is open
    if (activeWalletSetting === "new") return;

    setLocation("/wallets/" + firstWallet.address);
  }, [wallets, activeWalletSetting]);

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
      <Wrapper>
        <SearchInput
          placeholder={browser.i18n.getMessage("search_wallets")}
          {...searchInput.bindings}
          sticky
        />
        <Spacer y={1} />
        {wallets && (
          <Reorder.Group
            as="div"
            axis="y"
            onReorder={setWallets}
            values={wallets}
          >
            {wallets.filter(filterSearchResults).map((wallet) => (
              <WalletListItem
                wallet={wallet}
                name={findLabel(wallet.address) || wallet.nickname}
                address={wallet.address}
                avatar={findAvatar(wallet.address)}
                active={activeWalletSetting === wallet.address}
                onClick={() => setLocation("/wallets/" + wallet.address)}
                key={wallet.address}
              />
            ))}
          </Reorder.Group>
        )}
      </Wrapper>
      <AddWalletButton onClick={() => setLocation("/wallets/new")}>
        <PlusIcon />
      </AddWalletButton>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;

const AddWalletButton = styled(IconButton).attrs({
  secondary: true
})`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  z-index: 20;
  background: linear-gradient(
      0deg,
      rgba(${(props) => props.theme.theme}, 0.2),
      rgba(${(props) => props.theme.theme}, 0.2)
    ),
    rgb(${(props) => props.theme.background});
`;
