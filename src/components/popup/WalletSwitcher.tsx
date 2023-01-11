import {
  CheckIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
  WalletIcon
} from "@iconicicons/react";
import {
  Button,
  Card,
  Section,
  Text,
  Tooltip,
  useToasts
} from "@arconnect/components";
import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { motion, AnimatePresence } from "framer-motion";
import type { HardwareApi } from "~wallets/hardware";
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import { useEffect, useState } from "react";
import HardwareWalletIcon from "~components/HardwareWalletIcon";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import styled from "styled-components";
import Arweave from "@arconnect/arweave";

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
    area: "local",
    isSecret: true
  });

  // all wallets added
  const [storedWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
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
          balance: 0,
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

      // update wallets state
      setWallets((val) =>
        val.map((wallet) => {
          const profile = profiles.find(({ user }) => user === wallet.address);

          return {
            ...wallet,
            name: profile?.currentLabel
              ? profile.currentLabel + ".ar"
              : wallet.name,
            avatar: profile?.avatar
              ? concatGatewayURL(defaultGateway) + "/" + profile.avatar
              : undefined,
            hasAns: !!profile
          };
        })
      );

      setLoadedAns(true);
    })();
  }, [wallets]);

  // load wallet balances
  const [loadedBalances, setLoadedBalances] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallets.length === 0 || loadedBalances) return;

      const arweave = new Arweave(defaultGateway);

      for (const { address } of wallets) {
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
              balance: Number(balance)
            };
          })
        );
      }

      setLoadedBalances(true);
    })();
  }, [wallets]);

  // toasts
  const { setToast } = useToasts();

  // fetch ANS name (cached in storage)
  const [_, setAns] = useStorage<AnsUser | {}>({
    key: "ans_data",
    area: "local",
    isSecret: true
  });

  useEffect(() => {
    (async () => {
      const user = await getAnsProfile(activeAddress);

      if (!user) {
        return setAns({});
      }

      setAns(user as AnsUser);
    })();
  }, [activeAddress]);

  return (
    <AnimatePresence>
      {open && (
        <SwitcherPopover
          exactTop={exactTop}
          variants={{
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
          }}
        >
          <Wrapper noPadding={!!noPadding}>
            <WalletsCard
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
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
                          wallet.name.length > 14 ? 3 : 6
                        )}
                        )
                      </Text>
                      {wallet.address === activeAddress && <ActiveIndicator />}
                    </WalletTitle>
                    <Balance>
                      {wallet.balance.toLocaleString(undefined, {
                        maximumFractionDigits: 2
                      })}
                      <span>AR</span>
                    </Balance>
                  </WalletData>
                  <Avatar img={wallet.avatar}>
                    {!wallet.avatar && <NoAvatarIcon />}
                    {wallet.api === "keystone" && (
                      <HardwareWalletIcon icon={keystoneLogo} color="#2161FF" />
                    )}
                  </Avatar>
                </Wallet>
              ))}
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
                    <PlusIcon />
                    {browser.i18n.getMessage("addWallet")}
                  </AddWalletButton>
                  <Tooltip content={browser.i18n.getMessage("edit")}>
                    <EditButton
                      onClick={() =>
                        browser.tabs.create({
                          url: browser.runtime.getURL(
                            `tabs/dashboard.html#/wallets/${activeAddress}`
                          )
                        })
                      }
                    />
                  </Tooltip>
                </ActionBar>
              )}
            </WalletsCard>
          </Wrapper>
        </SwitcherPopover>
      )}
    </AnimatePresence>
  );
}

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
  padding-top: 0;
  padding-bottom: 0;
  ${(props) => (props.noPadding ? "padding: 0;" : "")}
`;

const WalletsCard = styled(Card)`
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
    background-color: rgb(${(props) => props.theme.cardBorder}, 0.65);
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
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.45rem ${wallet_side_padding};
`;

const AddWalletButton = styled(Button).attrs({
  fullWidth: true,
  small: true
})`
  padding: 0.72rem 0;
`;

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

const DeleteIcon = styled(TrashIcon)`
  position: absolute;
  font-size: 1.25rem;
  color: #fff;
  width: 1em;
  height: 1em;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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
  balance: number;
  avatar?: string;
  hasAns: boolean;
}
