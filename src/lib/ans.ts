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
    return await (
      await fetch(`https://ans-resolver.herokuapp.com/resolve/${address}/full`)
    ).json();
  } else {
    return await Promise.all(
      address.map(
        async (addr) =>
          await (
            await fetch(
              `https://ans-resolver.herokuapp.com/resolve/${addr}/full`
            )
          ).json()
      )
    );
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
  address: string;
  primary_domain: string;
  ownedDomains: {
    domain: string;
    color: string;
    subdomains: string[];
    record: unknown;
    created_at: number;
  }[];
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
