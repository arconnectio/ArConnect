import axios from "axios";
import { defaultGateway, type Gateway, defaultGARCacheURL } from "./gateway";
import { useEffect, useState } from "react";
import {
  extractGarItems,
  isValidGateway,
  pingUpdater,
  sortGatewaysByOperatorStake
} from "~lib/wayfinder";

export async function findGateway(
  requirements: Requirements
): Promise<Gateway> {
  let procDataStr = localStorage.getItem("gateways");
  let procData = [];
  // get gateways for now, cache this later
  if (!procDataStr) {
    const gateways = await axios
      .get(defaultGARCacheURL)
      .then((data) => data.data);
    const garItems = extractGarItems(gateways);
    const pinged = await pingUpdater(garItems, (newData) => {
      procData = [...newData];
    });
    localStorage.setItem("gateways", JSON.stringify(procData));
  } else {
    procData = JSON.parse(procDataStr);
  }

  try {
    if (requirements.startBlock === 0) {
      return defaultGateway;
    }
    // this could probably be filtered out during the caching process
    const filteredGateways = procData.filter((gateway) => {
      return (
        gateway.ping.status === "success" && gateway.health.status === "success"
      );
    });

    const sortedGateways = sortGatewaysByOperatorStake(filteredGateways);

    const top10 = sortedGateways.slice(0, Math.min(10, sortedGateways.length));
    const randomIndex = Math.floor(Math.random() * top10.length);
    const selectedGateway = top10[randomIndex];

    // if requirements is empty
    if (Object.keys(requirements).length === 0) {
      return {
        host: selectedGateway.settings.fqdn,
        port: selectedGateway.settings.port,
        protocol: selectedGateway.settings.protocol
      };
    }
    for (let i = 0; i < top10.length; i++) {
      const selectedGateway = top10[i];
      if (isValidGateway(selectedGateway, requirements)) {
        return {
          host: selectedGateway.settings.fqdn,
          port: selectedGateway.settings.port,
          protocol: selectedGateway.settings.protocol
        };
      }
    }

    return defaultGateway;
  } catch (err) {
    console.log("err", err);
  }
}

/**
 * Gateway hook that uses wayfinder to select the active gateway.
 */
export function useGateway(requirements: Requirements) {
  // currently active gw
  const [activeGateway, setActiveGateway] = useState<Gateway>(defaultGateway);

  useEffect(() => {
    (async () => {
      try {
        // select recommended gateway using wayfinder
        const recommended = await findGateway(requirements);

        setActiveGateway(recommended);
      } catch {}
    })();
  }, []);

  // TODO: health check

  return activeGateway;
}

export interface Requirements {
  /* Whether the gateway should support GraphQL requests */
  graphql?: boolean;
  /* Should the gateway support ArNS */
  arns?: boolean;
  /**
   * The block where the gateway should start syncing data from.
   * Set for 0 to include all blocks.
   * If undefined, wayfinder will not ensure that the start block
   * is 0.
   */
  startBlock?: number;
  /**
   * Ensure that the gateway has a high stake. This is required
   * with data that is important to be accurate. If true, wayfinder
   * will make sure that the gateway stake is higher than the
   * average stake of ar.io nodes.
   */
  ensureStake?: boolean;
}
