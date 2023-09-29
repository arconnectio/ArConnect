import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import type {
  gatewayAddressRegistryCache,
  gatewayAddressRegistryItem,
  processedData
} from "~gateways/types";
import type { Requirements } from "~gateways/wayfinder";

const pingStaggerDelayMs = 10; // 0.01s
const pingTimeout = 5000; // 5s

const properties = {
  FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44: {
    GRAPHQL: true,
    ARNS: true,
    MAX_PAGE_SIZE: 5000
  },
  "raJgvbFU-YAnku-WsupIdbTsqqGLQiYpGzoqk9SCVgY": {
    GRAPHQL: true,
    ARNS: true,
    MAX_PAGE_SIZE: 1000
  }
};

const pingUpdater = async (
  data: gatewayAddressRegistryItem[],
  onUpdate: any
) => {
  const newData = structuredClone(data);
  const pingPromises = data.map((item, index) => async () => {
    const delayMs = pingStaggerDelayMs * index;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      newData[index].ping = { status: "pending" };
      onUpdate(newData);

      const url = `${item.linkFull}/ar-io/healthcheck`;
      const controller = new AbortController();
      const timeoutTrigger = setTimeout(() => controller.abort(), pingTimeout);

      const start = Date.now();
      const fetchResult = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-cache"
      });
      const end = Date.now();
      const duration = end - start;

      clearTimeout(timeoutTrigger);
      newData[index].ping = { status: "success", value: duration };
      onUpdate(newData);

      try {
        newData[index].health = { status: "pending" };
        onUpdate(newData);

        const healthJson = await fetchResult.json();
        const propertyTxn = newData[index].settings.properties;

        newData[index].health = {
          status: "success"
        };
        // Save txn properties, hardcoded
        newData[index].properties = properties[propertyTxn];

        onUpdate(newData);
      } catch (e) {
        console.error(e);
        newData[index].health = {
          status: "error",
          error: e?.toString() ?? JSON.stringify(e)
        };
        onUpdate(newData);
      }
    } catch (e) {
      console.error(e);
      newData[index].ping = {
        status: "error",
        error: e?.toString() ?? JSON.stringify(e)
      };
      newData[index].health = {
        status: "error"
      };
      onUpdate(newData);
    }
  });
  await Promise.all(pingPromises.map((p) => p()));
};

// TODO: MAKE THIS WEIGH HTTP/HTTPS
const sortGatewaysByOperatorStake = (filteredGateways: processedData[]) => {
  const sortedGateways = filteredGateways.slice();

  sortedGateways.sort((gatewayA, gatewayB) => {
    const protocolA = gatewayA.settings.protocol;
    const protocolB = gatewayB.settings.protocol;

    // If gatewayA is HTTPS and gatewayB is HTTP, put gatewayA first
    if (protocolA === "https" && protocolB === "http") {
      return -1;
    }

    // If gatewayA is HTTP and gatewayB is HTTPS, put gatewayB first
    if (protocolA === "http" && protocolB === "https") {
      return 1;
    }

    // If both have the same protocol, compare by operatorStake
    return gatewayB.operatorStake - gatewayA.operatorStake;
  });

  return sortedGateways;
};

const fetchGatewayProperties = async (txn) => {
  const arweave = new Arweave(defaultGateway);
  const transaction = await arweave.transactions.getData(txn, {
    decode: true,
    string: true
  });
  const properties = JSON.parse(transaction as string);

  if (properties.GRAPHQL && properties.ARNS) {
    return transaction;
  } else {
    return null;
  }
};

const isValidGateway = (gateway: any, requirements: Requirements): boolean => {
  if (requirements.graphql && !gateway.properties.GRAPHQL) {
    return false;
  }
  if (requirements.arns && !gateway.properties.ARNS) {
    return false;
  }
  if (
    requirements.startBlock !== undefined &&
    gateway.start > requirements.startBlock
  ) {
    return false;
  }
  return true;
};

// FOR CACHING AND GETTING STATUS
const extractGarItems = (garCache: gatewayAddressRegistryCache) => {
  return Object.entries(garCache.gateways).map(([txId, item]) => {
    return {
      id: txId,
      ping: { status: "unknown" },
      health: { status: "unknown" },
      linkFull: linkFull(
        item.settings.protocol,
        item.settings.fqdn,
        item.settings.port
      ),
      linkDisplay: linkDisplay(
        item.settings.protocol,
        item.settings.fqdn,
        item.settings.port
      ),
      ...item
    };
  });
};

const linkFull = (protocol: string, fqdn: string, port: number) =>
  `${protocol}://${fqdn}:${port}`;

const linkDisplay = (protocol: string, fqdn: string, port: number) => {
  if (protocol === "https" && port === 443) return fqdn;
  if (protocol === "http" && port === 80) return `http://${fqdn}`;
  return linkFull(protocol, fqdn, port);
};

export {
  pingUpdater,
  extractGarItems,
  isValidGateway,
  linkFull,
  linkDisplay,
  sortGatewaysByOperatorStake,
  fetchGatewayProperties
};
