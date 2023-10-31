import { concatGatewayURL } from "~gateways/utils";
import { findGateway } from "~gateways/wayfinder";
import { useEffect, useState } from "react";

/**
 * Get the ANS profile for an address
 *
 * @param address Address to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfile(
  address: string | string[]
): Promise<AnsUser[] | AnsUser> {
  if (typeof address === "string") {
    try {
      const user = await (
        await fetch(`http://ans-stats.decent.land/profile/${address}`)
      ).json();

      return user;
    } catch {
      return undefined;
    }
  }
  const { res } = await (
    await fetch("https://ans-stats.decent.land/users")
  ).json();

  return res.filter(({ user }) => address?.includes(user));
}

/**
 * Get the ANS profile for a label
 *
 * @param label Label to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfileByLabel(label: string): Promise<AnsUser> {
  try {
    const user = await (
      await fetch(`http://ans-stats.decent.land/profile/${label}`)
    ).json();
    return user;
  } catch {
    return undefined;
  }
}

/**
 * React hook for a simple ANS profile
 *
 * @param query Address or label
 */
export function useAnsProfile(query: string) {
  const [profile, setProfile] = useState<{
    address: string;
    label: string;
    avatar?: string;
  }>();

  useEffect(() => {
    (async () => {
      if (!query) {
        return setProfile(undefined);
      }

      const profile = (await getAnsProfile(query)) as AnsUser;
      const gateway = await findGateway({ startBlock: 0 });

      if (!profile) {
        return setProfile(undefined);
      }

      setProfile({
        address: profile.user,
        label: profile.currentLabel + ".ar",
        avatar: profile.avatar
          ? concatGatewayURL(gateway) + "/" + profile.avatar
          : undefined
      });
    })();
  }, [query]);

  return profile;
}

export interface AnsUsers {
  res: AnsUser[];
}

export interface AnsUser {
  user: string;
  currentLabel: string;
  ownedLabels: {
    label: string;
    scarcity: string;
    acquisationBlock: number;
    mintedFor: 3;
  }[];
  nickname: string;
  address_color: string;
  bio: string;
  url?: string;
  avatar: string;
  earnings?: number;
  links: {
    github: string;
    twitter: string;
    customUrl: string;
    [platform: string]: string;
  };
  subdomains: any; // TODO
  freeSubdomains: number;
}

/**
 * Parse the cover image from the article HTML content
 *
 * @param content HTML content of the article
 * @returns Cover image link
 */
export function parseCoverImageFromContent(content: string) {
  // create simulated dom
  const wrapper = document.createElement("div");
  wrapper.innerHTML = content;

  // find cover image element
  const coverElement = wrapper.getElementsByTagName("img")[0];

  return coverElement?.src;
}
