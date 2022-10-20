import { WalletIcon } from "@iconicicons/react";
import { HTMLProps, useMemo } from "react";
import { formatAddress } from "~utils/format";
import BaseElement, { SettingIcon } from "./BaseElement";

export default function WalletListItem({
  name,
  address,
  avatar,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  const formattedAddress = useMemo(() => formatAddress(address, 8), [address]);

  return (
    <BaseElement
      title={name}
      description={formattedAddress}
      active={active}
      img={avatar}
      {...props}
    >
      {!avatar && <SettingIcon as={WalletIcon} />}
    </BaseElement>
  );
}

interface Props {
  avatar?: string;
  name: string;
  address: string;
  active: boolean;
}
