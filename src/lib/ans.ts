/**
 * Get the ANS profile for an address
 *
 * @param address Address to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfile(
  address: string | string[]
): Promise<AnsUser[] | AnsUser> {
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

/**
 * Get the ANS profile for a label
 *
 * @param label Label to fetch the profile for
 * @returns Profile data
 */
export async function getAnsProfileByLabel(label: string): Promise<AnsUser> {
  const { res } = await (
    await fetch("https://ans-stats.decent.land/users")
  ).json();

  return res.find(({ currentLabel }) => currentLabel === label);
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
