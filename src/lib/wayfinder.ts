import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import type { Requirements } from "~gateways/wayfinder";

const pingStaggerDelayMs = 10; // 0.01s
const pingTimeout = 5000; // 5s

// TODO: MAKE THIS WEIGH HTTP/HTTPS
const pingUpdater = async (data: any, onUpdate: any) => {
  const newData = structuredClone(data);
  const pingPromises = data.map((item: any, index: any) => async () => {
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

        // Save txn properties
        if (!newData[propertyTxn]) {
          const properties = await fetchGatewayProperties(propertyTxn);
          newData[propertyTxn] = JSON.parse(properties as string);
        }
        newData[index].properties = newData[propertyTxn];

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
  await Promise.all(pingPromises.map((p: any) => p()));
};

const sortGatewaysByOperatorStake = (filteredGateways) => {
  const sortedGateways = filteredGateways.slice();
  sortedGateways.sort(
    (gatewayA, gatewayB) => gatewayB.operatorStake - gatewayA.operatorStake
  );
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
const extractGarItems = (garCache: any) => {
  return Object.entries(garCache.gateways).map(([txId, item]: any) => {
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
