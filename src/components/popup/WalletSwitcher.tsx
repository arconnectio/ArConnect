import { Section, Text } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { GridIcon } from "@iconicicons/react";
import type { StoredWallet } from "~wallets";
import styled from "styled-components";
import { formatAddress } from "~utils/format";

export default function WalletSwitcher() {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
    },
    []
  );

  return (
    <Wrapper>
      <WalletName>
        <WalletIcon />
        <Text noMargin>
          {wallets.find(({ address }) => address === activeAddress)?.nickname}
        </Text>
        <WalletAddress>({formatAddress(activeAddress ?? "", 6)})</WalletAddress>
      </WalletName>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 2.2rem;
  padding-bottom: 1.75rem;
`;

const WalletName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;

  p {
    color: rgb(${(props) => props.theme.primaryText});
  }
`;

const WalletIcon = styled(GridIcon)`
  font-size: 1.35rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.primaryText});
`;

const WalletAddress = styled(Text).attrs(() => ({ noMargin: true }))`
  color: rgb(${(props) => props.theme.secondaryText}) !important;
`;
