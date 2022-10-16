import { concatGatewayURL, defaultGateway } from "~applications/gateway";
import { motion, AnimatePresence } from "framer-motion";
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~utils/ans";
import type { StoredWallet } from "~wallets";
import { Card } from "@arconnect/components";
import { useEffect, useState } from "react";
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
  useEffect(() => {
    (async () => {
      if (wallets.length === 0) return;

      const profiles = (await getAnsProfile(
        wallets.map((val) => val.address)
      )) as AnsUser[];

      setWallets((val) =>
        val.map((wallet) => {
          const profile = profiles.find(({ user }) => user === wallet.address);

          return {
            ...wallet,
            name: profile?.currentLabel || wallet.name,
            avatar: profile?.avatar
              ? concatGatewayURL(defaultGateway) + "/" + profile.avatar
              : undefined
          };
        })
      );
    })();
  }, [wallets]);

  // load wallet balances
  useEffect(() => {
    (async () => {
      if (wallets.length === 0) return;

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
    })();
  }, [wallets]);

  return (
    <AnimatePresence>
      {open && (
        <SwitcherPopover>
          <Card smallPadding>
            {wallets.map((wallet, i) => (
              <motion.div
                variants={walletAnimation}
                animate={open ? "open" : "closed"}
                key={i}
              >
                {wallet.name}
              </motion.div>
            ))}
          </Card>
        </SwitcherPopover>
      )}
    </AnimatePresence>
  );
}

const openAnimation = {
  open: {
    clipPath: "inset(0% 0% 0% 0% round 10px)",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.7,
      delayChildren: 0.3,
      staggerChildren: 0.05
    }
  },
  closed: {
    clipPath: "inset(10% 50% 90% 50% round 10px)",
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.3
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
  top: 100%;
  left: 0;
  right: 0;
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

interface Props {
  open: boolean;
}

interface DisplayedWallet {
  name: string;
  address: string;
  balance: number;
  avatar?: string;
}
