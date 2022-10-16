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
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~utils/ans";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import styled from "styled-components";
import Arweave from "arweave";

export default function WalletSwitcher({ open }: Props) {
  // current address
  const [activeAddress, setActiveAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // all wallets added
  const [storedWallets, setStoredWallets] = useStorage<StoredWallet[]>(
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
          balance: 0
        }))
      ),
    [storedWallets]
  );

  // load ANS data for wallet
  const [loadedAns, setLoadedAns] = useState(false);

  useEffect(() => {
    (async () => {
      if (wallets.length === 0 || loadedAns) return;

      const profiles = (await getAnsProfile(
        wallets.map((val) => val.address)
      )) as AnsUser[];

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
              : undefined
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

  // edit mode status
  const [editMode, setEditMode] = useState(false);

  // fixup wallet names
  useEffect(() => {
    if (editMode || storedWallets.length === 0) return;

    setStoredWallets((val) =>
      val.map((wallet, i) => {
        if (wallet.nickname !== "") {
          return wallet;
        }

        return {
          ...wallet,
          nickname: `Account ${i + 1}`
        };
      })
    );
  }, [editMode]);

  // disable edit mode on close
  useEffect(() => {
    if (!open) setEditMode(false);
  }, [open]);

  // toasts
  const { setToast } = useToasts();

  return (
    <AnimatePresence>
      {open && (
        <SwitcherPopover>
          <Wrapper>
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
                    if (editMode) return;
                    setActiveAddress(wallet.address);
                  }}
                >
                  <WalletData>
                    <WalletTitle>
                      <WalletName>
                        {(!editMode && wallet.name) || (
                          <WalletNameEditor
                            value={wallet.name}
                            onChange={(e) =>
                              setStoredWallets((val) =>
                                val.map((w) => {
                                  if (w.address !== wallet.address) return w;
                                  return {
                                    ...w,
                                    nickname: e.target.value
                                  };
                                })
                              )
                            }
                          />
                        )}
                      </WalletName>
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
                  <Avatar
                    img={!editMode ? wallet.avatar : undefined}
                    onClick={() => {
                      if (!editMode) return;
                      setToast({
                        content: `Remove ${wallet.name}?`,
                        duration: 4000,
                        action: {
                          name: "YES",
                          task: () =>
                            setStoredWallets((val) =>
                              val.filter((w) => w.address !== wallet.address)
                            )
                        }
                      });
                    }}
                  >
                    {!wallet.avatar && !editMode && <NoAvatarIcon />}
                    {editMode && <DeleteIcon />}
                  </Avatar>
                </Wallet>
              ))}
              <ActionBar>
                <AddWalletButton
                  onClick={() =>
                    browser.tabs.create({
                      url: browser.runtime.getURL(
                        "tabs/dashboard.html#add-wallet"
                      )
                    })
                  }
                >
                  <PlusIcon />
                  Add wallet
                </AddWalletButton>
                <Tooltip content="Edit">
                  <EditButton
                    onClick={() => setEditMode((val) => !val)}
                    as={editMode ? CheckIcon : undefined}
                  />
                </Tooltip>
              </ActionBar>
            </WalletsCard>
          </Wrapper>
        </SwitcherPopover>
      )}
    </AnimatePresence>
  );
}

const openAnimation = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "easeInOut",
      duration: 0.14
    }
  },
  closed: {
    opacity: 0,
    y: -20,
    scale: 0.8,
    transition: {
      type: "easeInOut",
      duration: 0.14
    }
  }
};

const SwitcherPopover = styled(motion.div).attrs({
  variants: openAnimation,
  initial: "closed",
  animate: "open",
  exit: "closed"
})`
  position: absolute;
  top: calc(100% - 1.05rem);
  left: 0;
  right: 0;
  z-index: 110;
  cursor: default;
`;

const Wrapper = styled(Section)`
  padding-top: 0;
  padding-bottom: 0;
`;

const WalletsCard = styled(Card)`
  padding: 0.3rem;
  background-color: rgb(${(props) => props.theme.background});
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
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgb(${(props) => props.theme.cardBorder}, 0.65);
  }

  &:active {
    transform: scale(0.86);
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

const WalletNameEditor = styled.input.attrs({
  type: "text"
})`
  border: none;
  outline: none;
  background-color: transparent;
  padding: 0;
  margin: 0;
  border-bottom: 1px dotted rgb(${(props) => props.theme.cardBorder});
  width: 5rem;
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
}

interface DisplayedWallet {
  name: string;
  address: string;
  balance: number;
  avatar?: string;
}
