import { WalletIcon } from "@iconicicons/react";
import { Reorder, useDragControls } from "framer-motion";
import { HTMLProps, useMemo } from "react";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
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
        img={avatar}
        dragControls={dragControls}
        {...props}
      >
        {!avatar && <SettingIcon as={WalletIcon} />}
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
