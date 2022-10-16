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
