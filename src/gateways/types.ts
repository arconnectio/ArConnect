interface gatewayAddressRegistryItemData {
  operatorStake: number;
  vaults: gatewayVault[];
  settings: {
    label: string;
    fqdn: string;
    port: number;
    protocol: string;
    properties?: any;
    note?: string;
  };
  status: "joined";
  start: number;
  end: number;
}

export interface gatewayAddressRegistryItem
  extends gatewayAddressRegistryItemData {
  id: string;
  linkFull: string;
  linkDisplay: string;
  ping: any;
  health: any;
}

export interface gatewayAddressRegistryCache {
  contractTxId: string;
  gateways: Record<string, gatewayAddressRegistryItemData>;
  evaluationOptions: {};
}

interface gatewayVault {
  balance: number;
  start: number;
  end: number;
}

export interface processedData {
  id: string;
  ping: {
    status: string;
    value: number;
  };
  health: {
    status: string;
  };
  linkFull: string;
  linkDisplay: string;
  operatorStake: number;
  vaults: any[];
  settings: {
    label: string;
    fqdn: string;
    port: number;
    protocol: string;
    properties: any;
    note: string;
  };
  status: string;
  start: number;
  end: number;
  properties: {
    GRAPHQL: boolean;
    ARNS: boolean;
    MAX_PAGE_SIZE: number;
  };
}
