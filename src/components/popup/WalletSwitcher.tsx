import { CopyIcon, EditIcon, PlusIcon, WalletIcon } from "@iconicicons/react";
import {
  ButtonV2,
  Card,
  Section,
  Text,
  TooltipV2,
  useToasts
} from "@arconnect/components";
import { concatGatewayURL } from "~gateways/utils";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { formatTokenBalance } from "~tokens/currency";
import type { HardwareApi } from "~wallets/hardware";
import { useStorage } from "@plasmohq/storage/hook";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import { useEffect, useState, type MouseEventHandler } from "react";
import HardwareWalletIcon from "~components/hardware/HardwareWalletIcon";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import { findGateway } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import styled from "styled-components";
import Arweave from "arweave";
import { svgie } from "~utils/svgies";
import { Action } from "./WalletHeader";
import copy from "copy-to-clipboard";
import { useHistory } from "~utils/hash_router";

export default function WalletSwitcher({
  open,
  close,
  showOptions = true,
  exactTop = false,
  noPadding = false
}: Props) {
  // current address
  const [activeAddress, setActiveAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all wallets added
  const [storedWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // load wallet datas
  const [wallets, setWallets] = useState<DisplayedWallet[]>([]);

  // load default wallets array
  useEffect(
    () =>
      setWallets(
        storedWallets.map((wallet) => ({
          name: wallet.nickname,
          address: wallet.address,
          balance: "0",
          hasAns: false,
          api: wallet.type === "hardware" ? wallet.api : undefined
        }))
      ),
    [storedWallets]
  );

  // load ANS data for wallet
  const [loadedAns, setLoadedAns] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallets.length === 0 || loadedAns) return;

      // get ans profiles
      const profiles = (await getAnsProfile(
        wallets.map((val) => val.address)
      )) as AnsUser[];
      const gateway = await findGateway({ startBlock: 0 });

      // update wallets state
      setWallets((val) =>
        val.map((wallet) => {
          const profile = profiles.find(({ user }) => user === wallet.address);
          const svgieAvatar = svgie(wallet.address, { asDataURI: true });

          return {
            ...wallet,
            name: profile?.currentLabel
              ? profile.currentLabel + ".ar"
              : wallet.name,
            avatar: profile?.avatar
              ? concatGatewayURL(gateway) + "/" + profile.avatar
              : svgieAvatar
              ? svgieAvatar
              : undefined,
            hasAns: !!profile
          };
        })
      );

      setLoadedAns(true);
    })();
  }, [wallets.length]);

  // load wallet balances
  const [loadedBalances, setLoadedBalances] = useState(false);

  const copyAddress = (
    e: React.MouseEvent,
    address: string,
    walletName: string
  ) => {
    e.stopPropagation();
    copy(address);
    setToast({
      type: "success",
      duration: 2000,
      content: browser.i18n.getMessage("copied_address", [
        walletName,
        formatAddress(address, 3)
      ])
    });
  };

  useEffect(() => {
    (async () => {
      if (wallets.length === 0 || loadedBalances) return;

      const gateway = await findGateway({});
      const arweave = new Arweave(gateway);

      await Promise.all(
        wallets.map(async ({ address }) => {
          try {
            // fetch balance
            const balance = arweave.ar.winstonToAr(
              await arweave.wallets.getBalance(address)
            );

            // update wallets
            setWallets((val) =>
              val.map((wallet) => {
                if (wallet.address !== address) {
                  return wallet;
                }

                return {
                  ...wallet,
                  balance
                };
              })
            );
          } catch (e) {}
        })
      );

      setLoadedBalances(true);
    })();
  }, [wallets.length]);

  // toasts
  const { setToast } = useToasts();

  const [push] = useHistory();

  return (
    <AnimatePresence>
      {open && (
        <SwitcherPopover exactTop={exactTop} variants={popoverAnimation}>
          <Wrapper noPadding={!!noPadding}>
            <WalletsCard
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Wallets>
                {wallets.map((wallet, i) => (
                  <Wallet
                    open={open}
                    key={i}
                    onClick={() => {
                      setActiveAddress(wallet.address);
                      setToast({
                        type: "success",
                        content: browser.i18n.getMessage("switchedToWallet", [
                          wallet.name
                        ]),
                        duration: 1100
                      });
                      close();
                    }}
                  >
                    <WalletData>
                      <WalletTitle>
                        <WalletName>{wallet.name}</WalletName>
                        <Text noMargin>
                          (
                          {formatAddress(
                            wallet.address,
                            wallet.name.length > 14 ? 3 : 4
                          )}
                          )
                        </Text>
                        <div>
                          <TooltipV2
                            content={browser.i18n.getMessage("copy_address")}
                            position="bottom"
                          >
                            <Action
                              as={CopyIcon}
                              onClick={(e) =>
                                copyAddress(e, wallet.address, wallet.name)
                              }
                              style={{ width: "15px", height: "15px" }}
                            />
                          </TooltipV2>
                        </div>
                        {wallet.address === activeAddress && (
                          <ActiveIndicator />
                        )}
                      </WalletTitle>
                      <Balance>
                        {formatTokenBalance(wallet.balance)}
                        <span>AR</span>
                      </Balance>
                    </WalletData>
                    <Avatar img={wallet.avatar}>
                      {!wallet.avatar && <NoAvatarIcon />}
                      {wallet.api === "keystone" && (
                        <HardwareWalletIcon
                          icon={keystoneLogo}
                          color="#2161FF"
                        />
                      )}
                    </Avatar>
                  </Wallet>
                ))}
              </Wallets>

              {showOptions && (
                <ActionBar>
                  <AddWalletButton
                    onClick={() =>
                      browser.tabs.create({
                        url: browser.runtime.getURL(
                          "tabs/dashboard.html#/wallets/new"
                        )
                      })
                    }
                  >
                    <PlusIcon style={{ marginRight: "5px" }} />
                    {browser.i18n.getMessage("add_wallet")}
                  </AddWalletButton>
                  <TooltipV2
                    content={browser.i18n.getMessage("edit")}
                    position="topEnd"
                  >
                    <EditButton
                      onClick={(e) => {
                        e.preventDefault();

                        push(`/quick-settings/wallets/${activeAddress}`);
                      }}
                    />
                  </TooltipV2>
                </ActionBar>
              )}
            </WalletsCard>
          </Wrapper>
        </SwitcherPopover>
      )}
    </AnimatePresence>
  );
}

export const popoverAnimation: Variants = {
  closed: {
    scale: 0.4,
    opacity: 0,
    transition: {
      type: "spring",
      duration: 0.4
    }
  },
  open: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.4,
      delayChildren: 0.2,
      staggerChildren: 0.05
    }
  }
};

const SwitcherPopover = styled(motion.div).attrs({
  initial: "closed",
  animate: "open",
  exit: "closed"
})<{ exactTop?: boolean }>`
  position: absolute;
  top: ${(props) => (props.exactTop ? "100%" : "calc(100% - 1.05rem)")};
  left: 0;
  right: 0;
  z-index: 110;
  cursor: default;
`;

const Wrapper = styled(Section)<{ noPadding: boolean }>`
  padding: 0 15px;
`;

const WalletsCard = styled(Card)`
  max-height: 80vh;
  overflow-y: auto;
  padding: 0;
`;

const Wallets = styled.div`
  padding: 0.3rem;
`;

const walletAnimation = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  closed: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const wallet_side_padding = "1.15rem";

const Wallet = styled(motion.div).attrs<{ open: boolean }>((props) => ({
  variants: walletAnimation,
  animate: props.open ? "open" : "closed"
}))<{ open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem ${wallet_side_padding};
  border-radius: 12px;
  cursor: pointer;
  background-color: transparent;
  transition: background-color 0.23s ease-in-out;

  &:hover {
    background-color: rgb(
      ${(props) => props.theme.theme},
      ${(props) => (props.theme.displayTheme === "light" ? "0.1" : "0.05")}
    );
  }

  &:active {
    transform: scale(0.975) !important;
  }
`;

const WalletData = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.13rem;
`;

const WalletTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const WalletName = styled(Text).attrs({ noMargin: true })`
  color: rgb(${(props) => props.theme.primaryText});
`;

const ActiveIndicator = styled.span`
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 100%;
  background-color: #14d110;
`;

const Balance = styled(Text).attrs({ noMargin: true })`
  font-size: 0.84rem;

  span {
    font-size: 0.7em;
    text-transform: uppercase;
  }
`;

const Avatar = styled(Squircle)`
  position: relative;
  width: 1.92rem;
  height: 1.92rem;
  cursor: pointer;

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }
`;

const NoAvatarIcon = styled(WalletIcon)`
  position: absolute;
  font-size: 1.2rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem calc(${wallet_side_padding} + 0.3rem);
  background-color: rgb(${(props) => props.theme.cardBackground});
`;

const AddWalletButton = styled(ButtonV2).attrs({
  fullWidth: true
})``;

const EditButton = styled(EditIcon)`
  font-size: 1.5rem;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.theme});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.8);
  }
`;

interface Props {
  open: boolean;
  close: () => any;
  showOptions?: boolean;
  exactTop?: boolean;
  noPadding?: boolean;
}

interface DisplayedWallet {
  name: string;
  api?: HardwareApi;
  address: string;
  balance: string;
  avatar?: string;
  hasAns: boolean;
}
