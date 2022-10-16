import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { Card, Section, Text } from "@arconnect/components";
import { motion, AnimatePresence } from "framer-motion";
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~utils/ans";
import { WalletIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import { useEffect, useState } from "react";
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

  return (
    <AnimatePresence>
      {open && (
        <SwitcherPopover>
          <Wrapper>
            <WalletsCard>
              {wallets.map((wallet, i) => (
                <Wallet
                  open={open}
                  key={i}
                  onClick={() => setActiveAddress(wallet.address)}
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
                  </Avatar>
                </Wallet>
              ))}
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
`;

const Wrapper = styled(Section)`
  padding-top: 0;
  padding-bottom: 0;
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

const Wallet = styled(motion.div).attrs<{ open: boolean }>((props) => ({
  variants: walletAnimation,
  animate: props.open ? "open" : "closed"
}))<{ open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 1.15rem;
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

interface Props {
  open: boolean;
}

interface DisplayedWallet {
  name: string;
  address: string;
  balance: number;
  avatar?: string;
}
