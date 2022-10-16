import axios from "axios";

/**
 * Get the ANS profile for an address
 *
 * @param address Address to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfile(address: string | string[]) {
  const { data } = await axios.get<AnsUsers>(
    "https://ans-stats.decent.land/users"
  );

  if (typeof address === "string") {
    const user = data.res.find(({ user }) => user === address);

    return user;
  } else {
    return data.res.filter(({ user }) => address?.includes(user));
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
