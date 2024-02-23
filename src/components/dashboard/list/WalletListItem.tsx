import { WalletIcon } from "@iconicicons/react";
import { Reorder, useDragControls } from "framer-motion";
import { type HTMLProps, useMemo } from "react";
import styled from "styled-components";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import HardwareWalletIcon from "~components/hardware/HardwareWalletIcon";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import BaseElement, { SettingIcon } from "./BaseElement";

export default function WalletListItem({
  wallet,
  name,
  address,
  avatar,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  // format address
  const formattedAddress = useMemo(() => formatAddress(address, 8), [address]);

  // allow dragging with the drag icon
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={wallet}
      id={address}
      dragListener={false}
      dragControls={dragControls}
    >
      <BaseElement
        title={name}
        description={formattedAddress}
        active={active}
        img={avatar || wallet?.avatar}
        dragControls={dragControls}
        {...props}
      >
        {!avatar && !wallet?.avatar && <SettingIcon as={WalletIcon} />}
        {wallet.type === "hardware" && wallet.api === "keystone" && (
          <HardwareIcon icon={keystoneLogo} color="#2161FF" />
        )}
      </BaseElement>
    </Reorder.Item>
  );
}

interface Props {
  wallet: StoredWallet;
  avatar?: string;
  name: string;
  address: string;
  active: boolean;
}

const HardwareIcon = styled(HardwareWalletIcon)`
  position: absolute;
  width: 24px;
  height: 24px;
  right: -5px;
  bottom: -5px;
`;
