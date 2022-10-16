import { ChevronDownIcon, GridIcon, UserIcon } from "@iconicicons/react";
import { defaultGateway, concatGatewayURL } from "~applications/gateway";
import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { Section, Text, Tooltip } from "@arconnect/components";
import type { AnsUser, AnsUsers } from "~utils/faces";
import { useStorage } from "@plasmohq/storage/hook";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import Squircle from "~components/Squircle";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import axios from "axios";

export default function WalletSwitcher() {
  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
    },
    []
  );

  // is the wallet selector open
  const [isOpen, setOpen] = useState(false);

  // copy current address
  const copyAddress: MouseEventHandler = (e) => {
    e.stopPropagation();
    copy(activeAddress);
  };

  // fetch ANS name (cached in storage)
  const [ans, setAns] = useStorage<AnsUser>({
    key: "ans_data",
    area: "local",
    isSecret: true
  });

  useEffect(() => {
    (async () => {
      const { data } = await axios.get<AnsUsers>(
        "https://ans-stats.decent.land/users"
      );

      setAns(data.res.find(({ user }) => user === activeAddress));
    })();
  }, [activeAddress]);

  // wallet name
  const walletName = useMemo(() => {
    if (!ans?.currentLabel) {
      const wallet = wallets.find(({ address }) => address === activeAddress);

      return wallet?.nickname || "Wallet";
    }

    return ans.currentLabel + ".ar";
  }, [wallets, ans, activeAddress]);

  // profile picture
  const avatar = useMemo(() => {
    if (!!ans?.avatar) {
      return concatGatewayURL(defaultGateway) + "/" + ans.avatar;
    }

    return undefined;
  }, [ans]);

  return (
    <Wrapper onClick={() => setOpen((val) => !val)}>
      <Wallet>
        <WalletIcon />
        <Text noMargin>{walletName}</Text>
        <WithArrow>
          <Tooltip content="Click to copy" position="bottom">
            <WalletAddress onClick={copyAddress}>
              (
              {formatAddress(
                activeAddress ?? "",
                walletName.length > 14 ? 3 : 6
              )}
              )
            </WalletAddress>
          </Tooltip>
          <ExpandArrow expanded={isOpen} />
        </WithArrow>
      </Wallet>
      <Avatar img={avatar}>{!avatar && <NoAvatarIcon />}</Avatar>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 2.2rem;
  padding-bottom: 1.75rem;
  cursor: pointer;
`;

const Wallet = styled.div`
  display: flex;
  align-items: center;
  gap: 0.36rem;

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

const WithArrow = styled.div`
  display: flex;
  align-items: center;
`;

const WalletAddress = styled(Text).attrs(() => ({ noMargin: true }))`
  color: rgb(${(props) => props.theme.secondaryText}) !important;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.4;
  }
`;

const ExpandArrow = styled(ChevronDownIcon)<{ expanded: boolean }>`
  color: rgb(${(props) => props.theme.secondaryText});
  font-size: 1.2rem;
  width: 1em;
  height: 1em;
  transition: all 0.23s ease-in-out;

  transform: ${(props) => (props.expanded ? "rotate(180deg)" : "rotate(0)")};
`;

const Avatar = styled(Squircle)`
  position: relative;
  width: 2.1rem;
  height: 2.1rem;
`;

const NoAvatarIcon = styled(UserIcon)`
  position: absolute;
  font-size: 1.4rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;
