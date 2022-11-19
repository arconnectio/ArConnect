/**
 * Get the ANS profile for an address
 *
 * @param address Address to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfile(
  address: string | string[]
): Promise<AnsUsers | AnsUser> {
  const { res } = await (
    await fetch("https://ans-stats.decent.land/users")
  ).json();

  if (typeof address === "string") {
    const user = res.find(({ user }) => user === address);

    return user;
  } else {
    return res.filter(({ user }) => address?.includes(user));
  }
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
