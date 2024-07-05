interface GatewayAddressRegistryItemData {
  operatorStake: number;
  vaults: GatewayVault[];
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

export interface GatewayAddressRegistryItem
  extends GatewayAddressRegistryItemData {
  id: string;
  linkFull: string;
  linkDisplay: string;
  ping: any;
  health: any;
}

export interface GatewayAddressRegistryCache {
  // contractTxId: string;
  gateways: Record<string, GatewayAddressRegistryItemData>;
  // evaluationOptions: {};
}

interface GatewayVault {
  balance: number;
  start: number;
  end: number;
}

export interface ProcessedData {
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
