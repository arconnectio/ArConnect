import { defaultGateway, type Gateway } from "./gateway";
import { useEffect, useState } from "react";
import { isValidGateway, sortGatewaysByOperatorStake } from "~lib/wayfinder";

export async function findGateway(
  requirements: Requirements
): Promise<Gateway> {
  // let procData = [];
  // // get gateways for now, cache this later
  // const gateways = await axios
  //   .get(defaultGARCacheURL)
  //   .then((data) => data.data);
  // const garItems = extractGarItems(gateways);
  // const pinged = await pingUpdater(garItems, (newData) => {
  //   procData = [...newData];
  // });

  // console.log("gateways", gateways);

  try {
    if (requirements.startBlock === 0) {
      return defaultGateway;
    }
    // this could probably be filtered out during the caching process
    const filteredGateways = cache.filter((gateway) => {
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

const cache = [
  {
    id: "QGWqtJdLLgm2ehFWiiPzMaoFLD50CnGuzZIPEdoDRGQ",
    ping: {
      status: "success",
      value: 21
    },
    health: {
      status: "success"
    },
    linkFull: "https://ar-io.dev:443",
    linkDisplay: "ar-io.dev",
    operatorStake: 250000,
    vaults: [],
    settings: {
      label: "AR.IO Test",
      fqdn: "ar-io.dev",
      port: 443,
      protocol: "https",
      properties: "raJgvbFU-YAnku-WsupIdbTsqqGLQiYpGzoqk9SCVgY",
      note: "Test Gateway operated by PDS for the AR.IO ecosystem."
    },
    status: "joined",
    start: 1256694,
    end: 0
  },
  {
    id: "iKryOeZQMONi2965nKz528htMMN_sBcjlhc-VncoRjA",
    ping: {
      status: "success",
      value: 87
    },
    health: {
      status: "success"
    },
    linkFull: "http://gatewaypie.com:80",
    linkDisplay: "http://gatewaypie.com",
    operatorStake: 14000,
    vaults: [
      {
        balance: 1000,
        start: 1265443,
        end: 1269043
      }
    ],
    settings: {
      label: "Gatewaypie",
      fqdn: "gatewaypie.com",
      port: 80,
      protocol: "http",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Test gateway part of the AR.IO Gateway Ops Video Series.  Check it on Youtube!"
    },
    status: "joined",
    start: 1256697,
    end: 0
  },
  {
    id: "wlcEhTQY_qjDKTvTDZsb53aX8wivbOJZKnhLswdueZw",
    ping: {
      status: "success",
      value: 81
    },
    health: {
      status: "success"
    },
    linkFull: "https://vilenarios.com:443",
    linkDisplay: "vilenarios.com",
    operatorStake: 25000,
    vaults: [],
    settings: {
      label: "Vilenarios",
      fqdn: "vilenarios.com",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "A test gateway for ArDrive L2 data"
    },
    status: "joined",
    start: 1256698,
    end: 0
  },
  {
    id: "1H7WZIWhzwTH9FIcnuMqYkTsoyv1OTfGa_amvuYwrgo",
    ping: {
      status: "success",
      value: 80
    },
    health: {
      status: "success"
    },
    linkFull: "https://permagate.io:443",
    linkDisplay: "permagate.io",
    operatorStake: 100000,
    vaults: [],
    settings: {
      label: "Permagate",
      fqdn: "permagate.io",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1256738,
    end: 0
  },
  {
    id: "88TfXbrWazBDxwzZkd2K0zEtmMR9TXMOfYQ-u1WfV2I",
    ping: {
      status: "success",
      value: 66
    },
    health: {
      status: "success"
    },
    linkFull: "https://g8way.io:443",
    linkDisplay: "g8way.io",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "g8way",
      fqdn: "g8way.io",
      port: 443,
      protocol: "https",
      properties: "",
      note: "Owned and operated by rakis."
    },
    status: "joined",
    start: 1257397,
    end: 0
  },
  {
    id: "36Ar8VmyC7YS7JGaep9ca2ANjLABETTpxSeA7WOV45Y",
    ping: {
      status: "success",
      value: 79
    },
    health: {
      status: "success"
    },
    linkFull: "https://frostor.xyz:443",
    linkDisplay: "frostor.xyz",
    operatorStake: 20000,
    vaults: [],
    settings: {
      label: "IDeployedTooSoon",
      fqdn: "frostor.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "TFW you deploy too soon but now it's permanent"
    },
    status: "joined",
    start: 1257524,
    end: 0
  },
  {
    id: "xFK3NdQ1utoPQ2tXMgNKFn9oZGw0Tl4ihNo7JY5Ldnk",
    ping: {
      status: "success",
      value: 194
    },
    health: {
      status: "success"
    },
    linkFull: "https://blessingway.xyz:443",
    linkDisplay: "blessingway.xyz",
    operatorStake: 10121,
    vaults: [
      {
        balance: 2000,
        start: 1269315,
        end: 1272915
      }
    ],
    settings: {
      label: "megumii",
      fqdn: "blessingway.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    },
    status: "joined",
    start: 1258717,
    end: 0
  },
  {
    id: "cF0H0SKdnaDTqWKY9iJKBktTpdEWgb3GnlndE7ABv0Q",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://bobinstein.com:443",
    linkDisplay: "bobinstein.com",
    operatorStake: 15069,
    vaults: [],
    settings: {
      label: "BOB!!!!",
      fqdn: "bobinstein.com",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Believe me, folks, the AR.IO Gateway BOB!!!! is the best. I've seen many, but BOB!!!! tops them. Most reliable connection, tremendous content. Others can't compare. If you want the best, choose BOB!!!!. Others? Second rate. Sad!"
    },
    status: "joined",
    start: 1258820,
    end: 0
  },
  {
    id: "JVTzls8_vGow74rbTILPmFqIYIgvTR67MhwXqHdBBk0",
    ping: {
      status: "success",
      value: 176
    },
    health: {
      status: "success"
    },
    linkFull: "https://ar-dreamnode.xyz:443",
    linkDisplay: "ar-dreamnode.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "AlwaysBeDream",
      fqdn: "ar-dreamnode.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by @0xAlwaysbedream"
    },
    status: "joined",
    start: 1258849,
    end: 0
  },
  {
    id: "pY1nE1lnn8L_OUKgQnv8H7EvWwCE6AUYtGuTng6l_TI",
    ping: {
      status: "success",
      value: 164
    },
    health: {
      status: "success"
    },
    linkFull: "https://dwentz.xyz:443",
    linkDisplay: "dwentz.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "dwentz",
      fqdn: "dwentz.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "we love root"
    },
    status: "joined",
    start: 1258851,
    end: 0
  },
  {
    id: "iap-k1HQNUtkDLDooVsjQVg0FAWtudGtVsTSFQ3nn1o",
    ping: {
      status: "success",
      value: 180
    },
    health: {
      status: "success"
    },
    linkFull: "https://sulapan.com:443",
    linkDisplay: "sulapan.com",
    operatorStake: 11500,
    vaults: [],
    settings: {
      label: "NakedCat",
      fqdn: "sulapan.com",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by NakedCat - founder CodeBlockLabs."
    },
    status: "joined",
    start: 1258939,
    end: 0
  },
  {
    id: "0UU6I4Ty-KNoObPEkgdhdeLycTA3NLZhX5h2W7hZH84",
    ping: {
      status: "success",
      value: 172
    },
    health: {
      status: "success"
    },
    linkFull: "https://ruesandora.xyz:443",
    linkDisplay: "ruesandora.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "MyGateway",
      fqdn: "ruesandora.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "This is my test gateway for the network."
    },
    status: "joined",
    start: 1258972,
    end: 0
  },
  {
    id: "WEbn8SoCyjiRBEoV2JMV_F9SjW2aICHbBxVnJfyshb4",
    ping: {
      status: "success",
      value: 93
    },
    health: {
      status: "success"
    },
    linkFull: "https://rnodescrns.online:443",
    linkDisplay: "rnodescrns.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Roby",
      fqdn: "rnodescrns.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "The greatest liberation we can experience is from the slavery we impose on ourselves. We are slaves to ourselves and our sins.."
    },
    status: "joined",
    start: 1259026,
    end: 0
  },
  {
    id: "79ypdc-T-_s3wgfd0_OXkj9kkV5RPycKZsOoKXQ9YjI",
    ping: {
      status: "success",
      value: 83
    },
    health: {
      status: "success"
    },
    linkFull: "https://ar-kynraze.xyz:443",
    linkDisplay: "ar-kynraze.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Kynraze",
      fqdn: "ar-kynraze.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Empowering Networks"
    },
    status: "joined",
    start: 1259130,
    end: 0
  },
  {
    id: "HCE5_C0JQtOlPkaRQPO5G8BzoeKwJ1PzEiciVMKaFtI",
    ping: {
      status: "success",
      value: 208
    },
    health: {
      status: "success"
    },
    linkFull: "https://neuweltgeld.xyz:443",
    linkDisplay: "neuweltgeld.xyz",
    operatorStake: 10400,
    vaults: [],
    settings: {
      label: "GateOfRivia",
      fqdn: "neuweltgeld.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "irlandali_turist#7300 // RuesCommunity"
    },
    status: "joined",
    start: 1259343,
    end: 0
  },
  {
    id: "5rnjtnau4XYCj0Y6otDDg3sWcm9WutWcj08IQnkuP3o",
    ping: {
      status: "success",
      value: 102
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"
    },
    linkFull: "https://mpiicha.games:443",
    linkDisplay: "mpiicha.games",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "daffatma",
      fqdn: "mpiicha.games",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "bismillah jp yallah"
    },
    status: "joined",
    start: 1259348,
    end: 0
  },
  {
    id: "8LljZT1Qz4_Oph3KsFm-jxoCyyp8XfPmrpqDJNP_6v0",
    ping: {
      status: "success",
      value: 183
    },
    health: {
      status: "success"
    },
    linkFull: "https://jajangmedia.games:443",
    linkDisplay: "jajangmedia.games",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Semsfan",
      fqdn: "jajangmedia.games",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Be Yourself and Never Surrender"
    },
    status: "joined",
    start: 1259348,
    end: 0
  },
  {
    id: "VJo6fys5bcBWqB-Lrgbe4jb-1PHq0mwFTNSA-q5OeSY",
    ping: {
      status: "success",
      value: 87
    },
    health: {
      status: "success"
    },
    linkFull: "https://mojochoirul.works:443",
    linkDisplay: "mojochoirul.works",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Haruu",
      fqdn: "mojochoirul.works",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Love makes a family I will always remember that."
    },
    status: "joined",
    start: 1259360,
    end: 0
  },
  {
    id: "VRJxKTG_elvmu6ph7bA2ZDvBTRXoS4NJjQCkFUuJVhM",
    ping: {
      status: "success",
      value: 87
    },
    health: {
      status: "success"
    },
    linkFull: "https://crbaa.xyz:443",
    linkDisplay: "crbaa.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "crbaa",
      fqdn: "crbaa.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1259369,
    end: 0
  },
  {
    id: "TE0zVR32RF5qFAO8K50-pEivZpM_s35HK-dex-5d-IU",
    ping: {
      status: "success",
      value: 192
    },
    health: {
      status: "success"
    },
    linkFull: "https://saktinaga.live:443",
    linkDisplay: "saktinaga.live",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "saktinaga",
      fqdn: "saktinaga.live",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Long live king IVAR"
    },
    status: "joined",
    start: 1259407,
    end: 0
  },
  {
    id: "c1Cz1fTE4ak9jtTSszfv1GfIBKGYKmLDzKzuQJx3x6g",
    ping: {
      status: "success",
      value: 162
    },
    health: {
      status: "success"
    },
    linkFull: "https://ahmkah.online:443",
    linkDisplay: "ahmkah.online",
    operatorStake: 11000,
    vaults: [],
    settings: {
      label: "Ahmkah",
      fqdn: "ahmkah.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "ahmkah#6535"
    },
    status: "joined",
    start: 1259476,
    end: 0
  },
  {
    id: "o1toE8Y0PgmKW0NA44uBul9XlK_2-7_345Rm3Hdj1iQ",
    ping: {
      status: "success",
      value: 195
    },
    health: {
      status: "success"
    },
    linkFull: "https://spt-node.dev:443",
    linkDisplay: "spt-node.dev",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "SPT-NODE",
      fqdn: "spt-node.dev",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Join to my comunity https://t.me/ssipalingtestnet"
    },
    status: "joined",
    start: 1259499,
    end: 0
  },
  {
    id: "VEIZa_6U5a3-APyFoTmh9KE2PltALwEaaxRXAXnALUY",
    ping: {
      status: "success",
      value: 23
    },
    health: {
      status: "success"
    },
    linkFull: "https://cappucino.online:443",
    linkDisplay: "cappucino.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "cappucino.online",
      fqdn: "cappucino.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1259512,
    end: 0
  },
  {
    id: "4H1pwtd0GozlzIvmaIgWd-f8QOZ30mjdzyuYmxbLPzY",
    ping: {
      status: "success",
      value: 170
    },
    health: {
      status: "success"
    },
    linkFull: "https://nodecoyote.xyz:443",
    linkDisplay: "nodecoyote.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "nodeCoyote",
      fqdn: "nodecoyote.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "nodeCoyote"
    },
    status: "joined",
    start: 1259526,
    end: 0
  },
  {
    id: "1vi-2yNB3MaM9WDjjAtErsQrx44dzejUwFCZGcXIjhY",
    ping: {
      status: "success",
      value: 156
    },
    health: {
      status: "success"
    },
    linkFull: "https://warbandd.store:443",
    linkDisplay: "warbandd.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Warband",
      fqdn: "warbandd.store",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "warband7181"
    },
    status: "joined",
    start: 1259558,
    end: 0
  },
  {
    id: "2nTw2OcM2bBeuVP3M1JqJS8aqo-sJxCc4RlqVlHO-iM",
    ping: {
      status: "success",
      value: 195
    },
    health: {
      status: "success"
    },
    linkFull: "https://sannane.online:443",
    linkDisplay: "sannane.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "sananne",
      fqdn: "sannane.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1259577,
    end: 0
  },
  {
    id: "mgY0EHr3h5bKtk5RsAn-vjoeVNqwhFRyPl5FHgbi5mA",
    ping: {
      status: "success",
      value: 159
    },
    health: {
      status: "success"
    },
    linkFull: "https://logosnodos.site:443",
    linkDisplay: "logosnodos.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "logosnodos",
      fqdn: "logosnodos.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Trusted Validator"
    },
    status: "joined",
    start: 1259729,
    end: 0
  },
  {
    id: "osZP4D9cqeDvbVFBaEfjIxwc1QLIvRxUBRAxDIX9je8",
    ping: {
      status: "success",
      value: 186
    },
    health: {
      status: "success"
    },
    linkFull: "https://ruangnode.xyz:443",
    linkDisplay: "ruangnode.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "ruangnode",
      fqdn: "ruangnode.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Empowering together, building a stronger community"
    },
    status: "joined",
    start: 1259855,
    end: 0
  },
  {
    id: "eWIndWPgafim4UZh4pKCQGrA820gbas7_flQUYfTxi4",
    ping: {
      status: "success",
      value: 161
    },
    health: {
      status: "success"
    },
    linkFull: "https://optimysthic.site:443",
    linkDisplay: "optimysthic.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "optimysthic",
      fqdn: "optimysthic.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Blockchain for FUTURE - OptiMysthic"
    },
    status: "joined",
    start: 1259980,
    end: 0
  },
  {
    id: "V_SC3mtjzNHO55JuUtMGSXK_i4RL6PriSSyXcOOKhuY",
    ping: {
      status: "success",
      value: 162
    },
    health: {
      status: "success"
    },
    linkFull: "https://dnsarz.wtf:443",
    linkDisplay: "dnsarz.wtf",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "dnsarz",
      fqdn: "dnsarz.wtf",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "If I die before I wake I pray the LORD my soul to take."
    },
    status: "joined",
    start: 1260005,
    end: 0
  },
  {
    id: "dsLlufLlR-cuk1YzEC3e7i4T58cwL7V9xyLxfuERQbs",
    ping: {
      status: "success",
      value: 151
    },
    health: {
      status: "success"
    },
    linkFull: "https://anekagame.live:443",
    linkDisplay: "anekagame.live",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "wisedragon",
      fqdn: "anekagame.live",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Im such wise dragon"
    },
    status: "joined",
    start: 1260013,
    end: 0
  },
  {
    id: "vJtPhDxC929FLDHXZ97gqlbjIqnFIs6ygAEbkewIFVw",
    ping: {
      status: "success",
      value: 64
    },
    health: {
      status: "success"
    },
    linkFull: "https://learnandhunt.me:443",
    linkDisplay: "learnandhunt.me",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Mafisto",
      fqdn: "learnandhunt.me",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Welcome to my Ario page ladies and gentleman"
    },
    status: "joined",
    start: 1260019,
    end: 0
  },
  {
    id: "EVi_DAfMpiQo6OKI8gXEXMFkKgO6UHty90SY4TBROXk",
    ping: {
      status: "success",
      value: 164
    },
    health: {
      status: "success"
    },
    linkFull: "https://arweave.tech:443",
    linkDisplay: "arweave.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "GGWP",
      fqdn: "arweave.tech",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "ATM = Analyze, Try , Modify"
    },
    status: "joined",
    start: 1260025,
    end: 0
  },
  {
    id: "sURDg280uMFa8gdulQf77Rp4wQNIbBcRGN4mqaNBETs",
    ping: {
      status: "success",
      value: 26
    },
    health: {
      status: "success"
    },
    linkFull: "https://kaelvnode.xyz:443",
    linkDisplay: "kaelvnode.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Saandy",
      fqdn: "kaelvnode.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "The way to get started is to quit talking and begin doing."
    },
    status: "joined",
    start: 1260032,
    end: 0
  },
  {
    id: "svALQ7WJ9stbp-cmL-l1BsQO7MyQ6FE04t4XepNpnJo",
    ping: {
      status: "success",
      value: 86
    },
    health: {
      status: "success"
    },
    linkFull: "https://daffhaidar.me:443",
    linkDisplay: "daffhaidar.me",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Ruman",
      fqdn: "daffhaidar.me",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Dont force yourself to be perfect"
    },
    status: "joined",
    start: 1260069,
    end: 0
  },
  {
    id: "1Lo75DNzCl9GOg6kKbv1gT0aIyywpHIegzUilDC9sN4",
    ping: {
      status: "success",
      value: 172
    },
    health: {
      status: "success"
    },
    linkFull: "https://commissar.xyz:443",
    linkDisplay: "commissar.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Commissar",
      fqdn: "commissar.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "aykt00 -  Rues Community"
    },
    status: "joined",
    start: 1260076,
    end: 0
  },
  {
    id: "wcKWnmTSPiZcSmcXzY6vgKeWqIweANJGYMwpObYPzR4",
    ping: {
      status: "success",
      value: 175
    },
    health: {
      status: "success"
    },
    linkFull: "https://tuga5.tech:443",
    linkDisplay: "tuga5.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "SODA",
      fqdn: "tuga5.tech",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by SODA."
    },
    status: "joined",
    start: 1260094,
    end: 0
  },
  {
    id: "R3M-B9MxQroHoAzY7-Xeikxit2-s6f3WY927CgvJsh8",
    ping: {
      status: "success",
      value: 180
    },
    health: {
      status: "success"
    },
    linkFull: "https://diafora.site:443",
    linkDisplay: "diafora.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "joekarim",
      fqdn: "diafora.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by JoeKarim."
    },
    status: "joined",
    start: 1260094,
    end: 0
  },
  {
    id: "Rn4OrGl3mOJO5tceOH8z84__7jmb8AAkEkxqfqGFm6w",
    ping: {
      status: "success",
      value: 158
    },
    health: {
      status: "success"
    },
    linkFull: "https://azxx.xyz:443",
    linkDisplay: "azxx.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Azxx",
      fqdn: "azxx.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Sat Set Error."
    },
    status: "joined",
    start: 1260095,
    end: 0
  },
  {
    id: "YcPEBPK-oS5IUxtVgICcl3DdfhfVJfui5LkBss805SQ",
    ping: {
      status: "success",
      value: 214
    },
    health: {
      status: "success"
    },
    linkFull: "https://elessardarken.xyz:443",
    linkDisplay: "elessardarken.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "ElessarGateway",
      fqdn: "elessardarken.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by elessar referred and guided by Ruesandora."
    },
    status: "joined",
    start: 1260118,
    end: 0
  },
  {
    id: "cOSjdBGnj2MgSycM_h5E-OGxdKF7BDBmtgiUq2hQp4w",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://thekayz.click:443",
    linkDisplay: "thekayz.click",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "ThekayzGateway",
      fqdn: "thekayz.click",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Hello Thekayz from RuesCommunity"
    },
    status: "joined",
    start: 1260121,
    end: 0
  },
  {
    id: "PTFbpd9x3LivzC_JjSNp36mGwTDvZGAGwYE2fkR5Nvg",
    ping: {
      status: "success",
      value: 160
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"
    },
    linkFull: "https://002900.xyz:443",
    linkDisplay: "002900.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "shdx",
      fqdn: "002900.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by me."
    },
    status: "joined",
    start: 1260129,
    end: 0
  },
  {
    id: "XX4ssz8MKbXvbVXhBRl84TWDDwkkme96lMkjpL7IpXs",
    ping: {
      status: "success",
      value: 187
    },
    health: {
      status: "success"
    },
    linkFull: "https://kingsharald.xyz:443",
    linkDisplay: "kingsharald.xyz",
    operatorStake: 10120,
    vaults: [],
    settings: {
      label: "RuesGateway",
      fqdn: "kingsharald.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260177,
    end: 0
  },
  {
    id: "UGm_n-H39zJDxTNnwSfTMCsufjI0nhDAHFEX_JRng74",
    ping: {
      status: "success",
      value: 182
    },
    health: {
      status: "success"
    },
    linkFull: "https://0xyvz.xyz:443",
    linkDisplay: "0xyvz.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "0xyvzGateway",
      fqdn: "0xyvz.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by 0xyvz. With the decks of teacher Rues"
    },
    status: "joined",
    start: 1260177,
    end: 0
  },
  {
    id: "1erDIhwoWtE_1kCV6Ouc4cXEWfpEY9JfMNJdI9Op0-0",
    ping: {
      status: "success",
      value: 181
    },
    health: {
      status: "success"
    },
    linkFull: "https://yukovskibot.com:443",
    linkDisplay: "yukovskibot.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "RuesGateway",
      fqdn: "yukovskibot.com",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Rues bir gece ansizin"
    },
    status: "joined",
    start: 1260178,
    end: 0
  },
  {
    id: "ahGvm0adLZJEu0n5P10HlnvEz-kRtNC1kIOtcOQohj4",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://mutu.pro:443",
    linkDisplay: "mutu.pro",
    operatorStake: 10100,
    vaults: [],
    settings: {
      label: "mutu",
      fqdn: "mutu.pro",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260180,
    end: 0
  },
  {
    id: "SqEQ2UZcI6s4yU8jQMnmxSBmu1XYBg_eHoivzxYljU0",
    ping: {
      status: "success",
      value: 182
    },
    health: {
      status: "success"
    },
    linkFull: "https://shapezero.xyz:443",
    linkDisplay: "shapezero.xyz",
    operatorStake: 10100,
    vaults: [],
    settings: {
      label: "shapezeroGateway",
      fqdn: "shapezero.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Rues Community"
    },
    status: "joined",
    start: 1260183,
    end: 0
  },
  {
    id: "GG8zi-bWN-S7ANPBfKIo48NVWyM_OEm3B-xJW_AuvCU",
    ping: {
      status: "success",
      value: 166
    },
    health: {
      status: "success"
    },
    linkFull: "https://kanan1.shop:443",
    linkDisplay: "kanan1.shop",
    operatorStake: 10120,
    vaults: [],
    settings: {
      label: "KananGateway",
      fqdn: "kanan1.shop",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Greetings,Earthlings"
    },
    status: "joined",
    start: 1260186,
    end: 0
  },
  {
    id: "llpFQs81WBNqU5q7PDUnkkyzgMXtCOcqyL1nTvjKngc",
    ping: {
      status: "success",
      value: 161
    },
    health: {
      status: "success"
    },
    linkFull: "https://nodetester.com:443",
    linkDisplay: "nodetester.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Cinar Gateway",
      fqdn: "nodetester.com",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Rues community."
    },
    status: "joined",
    start: 1260188,
    end: 0
  },
  {
    id: "T7179iMclGFeIztwWy02XOM-5Ebx10TINteE8K8N5Dk",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://permanence-testing.org:443",
    linkDisplay: "permanence-testing.org",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Test Gateway",
      fqdn: "permanence-testing.org",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Fenerbahce. RuesCommunity"
    },
    status: "joined",
    start: 1260192,
    end: 0
  },
  {
    id: "PE0gBR0wwHlNA4k4He0K3iYc-EKPqjgm7dG65T9pNiw",
    ping: {
      status: "success",
      value: 175
    },
    health: {
      status: "success"
    },
    linkFull: "https://erenynk.xyz:443",
    linkDisplay: "erenynk.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "yanksgateway",
      fqdn: "erenynk.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260194,
    end: 0
  },
  {
    id: "TbEyj28xcqJBw_J5Rb6BGOzo4VhT-Qh15VMFul3FtTw",
    ping: {
      status: "success",
      value: 160
    },
    health: {
      status: "success"
    },
    linkFull: "https://chaintech.site:443",
    linkDisplay: "chaintech.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "HakannGateway",
      fqdn: "chaintech.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by Hakan Rues Community."
    },
    status: "joined",
    start: 1260194,
    end: 0
  },
  {
    id: "5wseWFMo4M1BsCJ_lxIU1bbLH7vMTL-SImx_x7eeCYM",
    ping: {
      status: "success",
      value: 165
    },
    health: {
      status: "success"
    },
    linkFull: "https://redwhiteconnect.xyz:443",
    linkDisplay: "redwhiteconnect.xyz",
    operatorStake: 10025,
    vaults: [],
    settings: {
      label: "Redwhite",
      fqdn: "redwhiteconnect.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Hello world hello RuesCommunity"
    },
    status: "joined",
    start: 1260195,
    end: 0
  },
  {
    id: "B3EVs5fnE-AhZ9_Bj1FDmIo12Pwq7XusGKqAX7753vU",
    ping: {
      status: "success",
      value: 187
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"
    },
    linkFull: "https://kriptosekici.online:443",
    linkDisplay: "kriptosekici.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "arn",
      fqdn: "kriptosekici.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF RuesCommunity."
    },
    status: "joined",
    start: 1260195,
    end: 0
  },
  {
    id: "U8tv0J-4zD3wcned1pj_MFTDAYNdlstkHC2k_tq7bFA",
    ping: {
      status: "success",
      value: 183
    },
    health: {
      status: "success"
    },
    linkFull: "https://olpakmetehan.site:443",
    linkDisplay: "olpakmetehan.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "meteGateway",
      fqdn: "olpakmetehan.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned by olpakmetehan :) Ruescommunity."
    },
    status: "joined",
    start: 1260197,
    end: 0
  },
  {
    id: "H4a8JFyhgPaaj1XAbnI-3g8WZMtNzyM2pODgbkloUFo",
    ping: {
      status: "success",
      value: 163
    },
    health: {
      status: "success"
    },
    linkFull: "https://kenyaligeralt.xyz:443",
    linkDisplay: "kenyaligeralt.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "KenyaliGateway",
      fqdn: "kenyaligeralt.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Kenyadan_sevgilerle_RUES_COMMUNITY"
    },
    status: "joined",
    start: 1260200,
    end: 0
  },
  {
    id: "uAsYw8-vGL6zgyDfImyW2MkiqI8IV2FteK_Fzz-JGWk",
    ping: {
      status: "success",
      value: 163
    },
    health: {
      status: "success"
    },
    linkFull: "https://yusufaytn.xyz:443",
    linkDisplay: "yusufaytn.xyz",
    operatorStake: 10100,
    vaults: [],
    settings: {
      label: "YusufaytnxyzWay",
      fqdn: "yusufaytn.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1260200,
    end: 0
  },
  {
    id: "AIqGsGV1iA9iwn2egL4rnGqGxLeEitLf5C98Fo8k3RQ",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://mysbe.xyz:443",
    linkDisplay: "mysbe.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "MYSBEGATEWAY",
      fqdn: "mysbe.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF.RuesCommunity"
    },
    status: "joined",
    start: 1260204,
    end: 0
  },
  {
    id: "YMMU4U8YGp7T8bBwB97OYK5AXs_2LzaLaI4O-i69Fbc",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://kazazel.xyz:443",
    linkDisplay: "kazazel.xyz",
    operatorStake: 10055,
    vaults: [],
    settings: {
      label: "Kazazelgateway",
      fqdn: "kazazel.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF RuesCommunity ."
    },
    status: "joined",
    start: 1260209,
    end: 0
  },
  {
    id: "-C5AiYcMmrOFHrnQwhJg1Xtzhz23T0zNB0ACge1otHs",
    ping: {
      status: "success",
      value: 166
    },
    health: {
      status: "success"
    },
    linkFull: "https://aralper.xyz:443",
    linkDisplay: "aralper.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "aralpergateway",
      fqdn: "aralper.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Ruescommunity"
    },
    status: "joined",
    start: 1260210,
    end: 0
  },
  {
    id: "XxXwZXwPouTKkpDa-jJWg3QWtoIwAp4zeCTfBYlBpXc",
    ping: {
      status: "success",
      value: 165
    },
    health: {
      status: "success"
    },
    linkFull: "https://berkanky.site:443",
    linkDisplay: "berkanky.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "BerkanGateway",
      fqdn: "berkanky.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260212,
    end: 0
  },
  {
    id: "ciQ7RQ8QPPv3bGoMfN2SlYIr0n8ZDLZ7_aDW-hM9pLQ",
    ping: {
      status: "success",
      value: 157
    },
    health: {
      status: "success"
    },
    linkFull: "https://vevivo.xyz:443",
    linkDisplay: "vevivo.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "vevivogateway",
      fqdn: "vevivo.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity."
    },
    status: "joined",
    start: 1260647,
    end: 0
  },
  {
    id: "1QTtaonUCeqpf0PiWjHgHhA1JixBDKQ7ECKaLUIv71o",
    ping: {
      status: "success",
      value: 167
    },
    health: {
      status: "success"
    },
    linkFull: "https://macanta.site:443",
    linkDisplay: "macanta.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "macantagateway",
      fqdn: "macanta.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity."
    },
    status: "joined",
    start: 1260652,
    end: 0
  },
  {
    id: "7CLRpr8HSFl9YJePgcMhlff5vNCMpj8EHd6rd7fNKsw",
    ping: {
      status: "success",
      value: 37
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"
    },
    linkFull: "https://mrdecode.tech:443",
    linkDisplay: "mrdecode.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Alfonova",
      fqdn: "mrdecode.tech",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Profesional Validator Alfonova"
    },
    status: "joined",
    start: 1260664,
    end: 0
  },
  {
    id: "5sqfubD1WdH2zrUcdf60uhXTofOjiJBBo3-wvV0z7P8",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://jembutkucing.tech:443",
    linkDisplay: "jembutkucing.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "jembutkucing",
      fqdn: "jembutkucing.tech",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by jembutkucing."
    },
    status: "joined",
    start: 1260671,
    end: 0
  },
  {
    id: "BxuqpwrYha0BYc6or091_25TCX8NbERPwXojhpAllSY",
    ping: {
      status: "success",
      value: 158
    },
    health: {
      status: "success"
    },
    linkFull: "https://xyznodes.site:443",
    linkDisplay: "xyznodes.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "xyzGateway",
      fqdn: "xyznodes.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Rues Community"
    },
    status: "joined",
    start: 1260671,
    end: 0
  },
  {
    id: "BXMzqT99f2ZZ3VTfhWcnHhya1ESQwzovK98F5WaSKu0",
    ping: {
      status: "success",
      value: 93
    },
    health: {
      status: "success"
    },
    linkFull: "https://0xmonyaaa.xyz:443",
    linkDisplay: "0xmonyaaa.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "monyaaa",
      fqdn: "0xmonyaaa.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1260704,
    end: 0
  },
  {
    id: "pzZHyQB1hWWt-Nthj0IRBvrmqGuyWxEOq04zqzU2cGA",
    ping: {
      status: "success",
      value: 190
    },
    health: {
      status: "success"
    },
    linkFull: "https://malghz.cloud:443",
    linkDisplay: "malghz.cloud",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "malghz",
      fqdn: "malghz.cloud",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Earn Everyday 24/7"
    },
    status: "joined",
    start: 1260714,
    end: 0
  },
  {
    id: "W-is11Lhz1V666jC8xkmxZxTRdFnSzkbvHc1NNsM878",
    ping: {
      status: "success",
      value: 172
    },
    health: {
      status: "success"
    },
    linkFull: "https://fisneci.com:443",
    linkDisplay: "fisneci.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Bayurnet",
      fqdn: "fisneci.com",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260714,
    end: 0
  },
  {
    id: "WapqioPyyeK2MgNUfx4UPB84D_-5U78ckEtqvVohmAU",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://blackswannodes.xyz:443",
    linkDisplay: "blackswannodes.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "blackswan",
      fqdn: "blackswannodes.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1260720,
    end: 0
  },
  {
    id: "cfUh77oKJiuJW6wbAb999RkN-lMKvX00PL0KKbvIz-0",
    ping: {
      status: "success",
      value: 181
    },
    health: {
      status: "success"
    },
    linkFull: "https://salakk.online:443",
    linkDisplay: "salakk.online",
    operatorStake: 10100,
    vaults: [],
    settings: {
      label: "salakGateWay",
      fqdn: "salakk.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "ReusCommunity."
    },
    status: "joined",
    start: 1260726,
    end: 0
  },
  {
    id: "PM_U5FLxnN09pzGRaIKH3ug0Akr7thkCgzajFe-32us",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://scriqtar.site:443",
    linkDisplay: "scriqtar.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "scriqtargateway",
      fqdn: "scriqtar.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260732,
    end: 0
  },
  {
    id: "chmRNNNAFKt2m_UvcRgBJi9iU03vX9WA5qq0-vX5aJ8",
    ping: {
      status: "success",
      value: 164
    },
    health: {
      status: "success"
    },
    linkFull: "https://rodruquez.online:443",
    linkDisplay: "rodruquez.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "RodruquezGateway",
      fqdn: "rodruquez.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity."
    },
    status: "joined",
    start: 1260736,
    end: 0
  },
  {
    id: "eUCh-rXyjdTZ5mLqZjs9tN0tVsvEKZoeEJsdnJ8eWTw",
    ping: {
      status: "success",
      value: 184
    },
    health: {
      status: "success"
    },
    linkFull: "https://velaryon.xyz:443",
    linkDisplay: "velaryon.xyz",
    operatorStake: 10050,
    vaults: [],
    settings: {
      label: "velaryongate",
      fqdn: "velaryon.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1260737,
    end: 0
  },
  {
    id: "sVrukY0n_lahPHV8-vulAhSQYMIbd1ZeFrXVYVehpB4",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://mtntkcn1.store:443",
    linkDisplay: "mtntkcn1.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "mtntkcnGateway",
      fqdn: "mtntkcn1.store",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "SEK ERKEK"
    },
    status: "joined",
    start: 1260745,
    end: 0
  },
  {
    id: "tsfe-wxLH9Pj3FOdSrw9vgvmlRzNigl8TvxJuB7IZ9U",
    ping: {
      status: "success",
      value: 157
    },
    health: {
      status: "success"
    },
    linkFull: "https://validatorario.xyz:443",
    linkDisplay: "validatorario.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Validatorario",
      fqdn: "validatorario.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity. dad"
    },
    status: "joined",
    start: 1260749,
    end: 0
  },
  {
    id: "YZiqI0g53KG0ZKgnoBxRKiA06Hsfa5l9P2hucWi8Res",
    ping: {
      status: "success",
      value: 168
    },
    health: {
      status: "success"
    },
    linkFull: "https://blockchainzk.website:443",
    linkDisplay: "blockchainzk.website",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "EdaGateway",
      fqdn: "blockchainzk.website",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260759,
    end: 0
  },
  {
    id: "BSclf0eS9c0OSc2rrNi0O9GFx9RRcyuX8YP60xolHLU",
    ping: {
      status: "success",
      value: 519
    },
    health: {
      status: "success"
    },
    linkFull: "https://lostgame.online:443",
    linkDisplay: "lostgame.online",
    operatorStake: 10300,
    vaults: [],
    settings: {
      label: "isoGateway",
      fqdn: "lostgame.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260768,
    end: 0
  },
  {
    id: "rQMLnByf-Gg2NHdxrod49GGcGR7HF89R-TEeEWKeq1I",
    ping: {
      status: "success",
      value: 555
    },
    health: {
      status: "success"
    },
    linkFull: "https://tikir.store:443",
    linkDisplay: "tikir.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "tikir",
      fqdn: "tikir.store",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "SEK ERKEK"
    },
    status: "joined",
    start: 1260796,
    end: 0
  },
  {
    id: "Mm_owPYAjpqu0FgrhsRtKGwEPr8kQCELd52VI-px3dk",
    ping: {
      status: "success",
      value: 62
    },
    health: {
      status: "success"
    },
    linkFull: "https://dilsinay.online:443",
    linkDisplay: "dilsinay.online",
    operatorStake: 11000,
    vaults: [],
    settings: {
      label: "dilsinayGateway",
      fqdn: "dilsinay.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260803,
    end: 0
  },
  {
    id: "byxIK7PnuVOsbNRKXoYl822pPUdInKgVCHLj2CNw9GE",
    ping: {
      status: "success",
      value: 478
    },
    health: {
      status: "success"
    },
    linkFull: "https://testnetnodes.xyz:443",
    linkDisplay: "testnetnodes.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "testnetnodes",
      fqdn: "testnetnodes.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260810,
    end: 0
  },
  {
    id: "BSk519PCjYmlhLWZsBlr2k2TzLU0mTruvHvcK2zIjKE",
    ping: {
      status: "success",
      value: 481
    },
    health: {
      status: "success"
    },
    linkFull: "https://analin.xyz:443",
    linkDisplay: "analin.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "canto12gateway",
      fqdn: "analin.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity."
    },
    status: "joined",
    start: 1260823,
    end: 0
  },
  {
    id: "lPNnW6NKj2rhgmR80_hVdWlnde6hne4PFUmdAuwVN0U",
    ping: {
      status: "success",
      value: 551
    },
    health: {
      status: "success"
    },
    linkFull: "https://zionalc.online:443",
    linkDisplay: "zionalc.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Ziongate",
      fqdn: "zionalc.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by zionalc from rues community."
    },
    status: "joined",
    start: 1260825,
    end: 0
  },
  {
    id: "1LUv6R9jUc7_eqhyOAnPjevurdO5tRqAAUGTdd57yrw",
    ping: {
      status: "success",
      value: 640
    },
    health: {
      status: "success"
    },
    linkFull: "https://bootstrap.lol:443",
    linkDisplay: "bootstrap.lol",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "ruesgateway",
      fqdn: "bootstrap.lol",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1260827,
    end: 0
  },
  {
    id: "miy5gTmrH5fzQjiXcRoOtX5Ux4e83BqgaMhxH2E-LDA",
    ping: {
      status: "success",
      value: 93
    },
    health: {
      status: "success"
    },
    linkFull: "https://cayu7pa.xyz:443",
    linkDisplay: "cayu7pa.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "cayu7paGateway",
      fqdn: "cayu7pa.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by cayu7pa by love."
    },
    status: "joined",
    start: 1260829,
    end: 0
  },
  {
    id: "s91BsMWRi8E4Lkmx0cjzwFNxTnlKjX6ne4mJ2jdMjHE",
    ping: {
      status: "success",
      value: 505
    },
    health: {
      status: "success"
    },
    linkFull: "https://grenimo.xyz:443",
    linkDisplay: "grenimo.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "grengateway",
      fqdn: "grenimo.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuessCommunity."
    },
    status: "joined",
    start: 1260845,
    end: 0
  },
  {
    id: "3Gr4shi-MU94pPC1g3vlMPPl39gffOoZwAcJd8UBtcQ",
    ping: {
      status: "success",
      value: 676
    },
    health: {
      status: "success"
    },
    linkFull: "https://cahil.store:443",
    linkDisplay: "cahil.store",
    operatorStake: 10101,
    vaults: [],
    settings: {
      label: "OgGateway",
      fqdn: "cahil.store",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "The OgGateway was created with the help of Ruesandora."
    },
    status: "joined",
    start: 1260846,
    end: 0
  },
  {
    id: "jjVHsJBuHYLJYpv3BHbtgwz1g96czpNevenyhnLhXpU",
    ping: {
      status: "success",
      value: 480
    },
    health: {
      status: "success"
    },
    linkFull: "https://sefaaa.online:443",
    linkDisplay: "sefaaa.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Test Gateway",
      fqdn: "sefaaa.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "we are Rues Communıty!"
    },
    status: "joined",
    start: 1260849,
    end: 0
  },
  {
    id: "2YryiJEk5NF71c4DaSZ3z9jnNRWW4zMuI5icTMrLIIU",
    ping: {
      status: "success",
      value: 561
    },
    health: {
      status: "success"
    },
    linkFull: "https://jaxtothehell.xyz:443",
    linkDisplay: "jaxtothehell.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "JaxGateway",
      fqdn: "jaxtothehell.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260852,
    end: 0
  },
  {
    id: "UdduK9fJ5AgvbHtBH35JtBiNwTSCSsZU6ZEyVeh5o6E",
    ping: {
      status: "success",
      value: 475
    },
    health: {
      status: "success"
    },
    linkFull: "https://canduesed.xyz:443",
    linkDisplay: "canduesed.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "CanduesEDGateway",
      fqdn: "canduesed.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260867,
    end: 0
  },
  {
    id: "Rpc4mjiFROD-MtP_xfb5mJOaGmfsjkJDYyKm-EYjsus",
    ping: {
      status: "success",
      value: 550
    },
    health: {
      status: "success"
    },
    linkFull: "https://anaraydinli.xyz:443",
    linkDisplay: "anaraydinli.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "AnarGateway",
      fqdn: "anaraydinli.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "RuesCommunity"
    },
    status: "joined",
    start: 1260879,
    end: 0
  },
  {
    id: "jqIlbPzgo_3BnXbvKh-oBNsnEuZ-UssxVOKsZEANiQE",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://blacktokyo.online:443",
    linkDisplay: "blacktokyo.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "blacktokyo",
      fqdn: "blacktokyo.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "the results will not betray the effort"
    },
    status: "joined",
    start: 1261005,
    end: 0
  },
  {
    id: "-d9S3ErrYlW1W7ZY_3BBqgbItgSkECClAYq6RSzf5Pc",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://coinhunterstr.site:443",
    linkDisplay: "coinhunterstr.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "CoinHuntersGateway",
      fqdn: "coinhunterstr.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Coin Hunters is here."
    },
    status: "joined",
    start: 1261221,
    end: 0
  },
  {
    id: "A10QqEe82AfWpQrIqbANJMQ5rivDEsSmxIVuX8W1-94",
    ping: {
      status: "success",
      value: 568
    },
    health: {
      status: "success"
    },
    linkFull: "https://digitclone.online:443",
    linkDisplay: "digitclone.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Digitgate",
      fqdn: "digitclone.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by digitclone."
    },
    status: "joined",
    start: 1261221,
    end: 0
  },
  {
    id: "mnW86GAW8jB7Wkd5Dm2QV1M7iw3oHfrf7vcyfNgMspg",
    ping: {
      status: "success",
      value: 189
    },
    health: {
      status: "success"
    },
    linkFull: "https://armanmind.lol:443",
    linkDisplay: "armanmind.lol",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Test Gateway",
      fqdn: "armanmind.lol",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by DTF."
    },
    status: "joined",
    start: 1261284,
    end: 0
  },
  {
    id: "cSSmABifu5RIRONaQwhE4ZfKhIkV8TKE3Jh21L8aq0c",
    ping: {
      status: "success",
      value: 182
    },
    health: {
      status: "success"
    },
    linkFull: "https://htonka.xyz:443",
    linkDisplay: "htonka.xyz",
    operatorStake: 10100,
    vaults: [],
    settings: {
      label: "Hamzagateway",
      fqdn: "htonka.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "A world brand Ruescommunity."
    },
    status: "joined",
    start: 1261352,
    end: 0
  },
  {
    id: "sQ32BruFcrHMjfnr9To0X63WkRq7k-5NWNC865OwX8g",
    ping: {
      status: "success",
      value: 171
    },
    health: {
      status: "success"
    },
    linkFull: "https://afiq.wiki:443",
    linkDisplay: "afiq.wiki",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "AfiqHaekal",
      fqdn: "afiq.wiki",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "IYKYK"
    },
    status: "joined",
    start: 1261352,
    end: 0
  },
  {
    id: "EAvM2f0w4jo-i3d6TM4gZgyhWP49PDOjRIYGcHosXNw",
    ping: {
      status: "success",
      value: 185
    },
    health: {
      status: "success"
    },
    linkFull: "https://byfalib.xyz:443",
    linkDisplay: "byfalib.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "ByfalibGateway",
      fqdn: "byfalib.xyz",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated byfalib"
    },
    status: "joined",
    start: 1261352,
    end: 0
  },
  {
    id: "5r4mGZOFpwrXppvsYruhhBz63s6uBbJBZCWpaEG-L_Y",
    ping: {
      status: "success",
      value: 22
    },
    health: {
      status: "success"
    },
    linkFull: "https://crtexpert.com.tr:443",
    linkDisplay: "crtexpert.com.tr",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "CrtexpertGateway",
      fqdn: "crtexpert.com.tr",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated by Crtexpert , RuesCommunity"
    },
    status: "joined",
    start: 1261356,
    end: 0
  },
  {
    id: "YvB3ZsstU05UH8lDR-lK9xG1gMUmpMRWX08kEX8RpTs",
    ping: {
      status: "success",
      value: 181
    },
    health: {
      status: "success"
    },
    linkFull: "https://ezraike.art:443",
    linkDisplay: "ezraike.art",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "EzraikeeGateaway",
      fqdn: "ezraike.art",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "saudade"
    },
    status: "joined",
    start: 1261357,
    end: 0
  },
  {
    id: "TDsb87pM3s3em7oRXoTyClq7LpNZMLPdsQTS83aAYSU",
    ping: {
      status: "success",
      value: 156
    },
    health: {
      status: "success"
    },
    linkFull: "https://bolobolo.site:443",
    linkDisplay: "bolobolo.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "Bolobolo",
      fqdn: "bolobolo.site",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Gaskeun garap."
    },
    status: "joined",
    start: 1261366,
    end: 0
  },
  {
    id: "zFBm5PN2a8AFoDivZ4cBOmspBiENWBdXz15rEXpGxC4",
    ping: {
      status: "success",
      value: 159
    },
    health: {
      status: "success"
    },
    linkFull: "https://rerererararags.store:443",
    linkDisplay: "rerererararags.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      label: "yasingateway",
      fqdn: "rerererararags.store",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "Owned and operated and ruescommunity."
    },
    status: "joined",
    start: 1261422,
    end: 0
  },
  {
    id: "ghGftRJ6mcBSqL1g9b4DIfqs4tbD4CuDXtAZaYRSzDs",
    ping: {
      status: "success",
      value: 159
    },
    health: {
      status: "success"
    },
    linkFull: "https://aleko0o.store:443",
    linkDisplay: "aleko0o.store",
    operatorStake: 11000,
    vaults: [],
    settings: {
      label: "aleko0ogateway",
      fqdn: "aleko0o.store",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "AliErcan#4551 RuesCommunity"
    },
    status: "joined",
    start: 1261425,
    end: 0
  },
  {
    id: "23I4olKDdl60_CKHh8dfDZ4WkRJE_42Q8WV5AsFmbK0",
    ping: {
      status: "success",
      value: 194
    },
    health: {
      status: "success"
    },
    linkFull: "https://shadow39.online:443",
    linkDisplay: "shadow39.online",
    operatorStake: 10100,
    vaults: [],
    settings: {
      label: "Shadowgateway",
      fqdn: "shadow39.online",
      port: 443,
      protocol: "https",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      note: "I am Feeling Good"
    },
    status: "joined",
    start: 1261431,
    end: 0
  },
  {
    id: "1DkiG-bX-EnXBHtIYnBPLHXLLUQtTZiw9qgMgRrnahA",
    ping: {
      status: "success",
      value: 647
    },
    health: {
      status: "success"
    },
    linkFull: "https://thecoldblooded.net:443",
    linkDisplay: "thecoldblooded.net",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "thecoldblooded.net",
      label: "thecoldbloodedGateway",
      note: "Best of all ;)",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261475,
    end: 0
  },
  {
    id: "s8u2SDPNU3ndJdzi-dIwJ6xJyjg4_O_stmWpJfnqQ_0",
    ping: {
      status: "success",
      value: 172
    },
    health: {
      status: "success"
    },
    linkFull: "https://omersukrubektas.website:443",
    linkDisplay: "omersukrubektas.website",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "omersukrubektas.website",
      label: "omerbektasgateway",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261504,
    end: 0
  },
  {
    id: "mS5AXWZk4qHb73AXlPUu6gDETWlAFGqOP5jJisixE4o",
    ping: {
      status: "success",
      value: 504
    },
    health: {
      status: "success"
    },
    linkFull: "https://sedat07.xyz:443",
    linkDisplay: "sedat07.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "sedat07.xyz",
      label: "RuesGateway",
      note: "Owned and operator sedat07 RuesCommunity.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261504,
    end: 0
  },
  {
    id: "ELNfYA5smn50JSL7Na0RBy9122pUR-nk3zcl-MR5D6s",
    ping: {
      status: "success",
      value: 29
    },
    health: {
      status: "success"
    },
    linkFull: "https://flechemano.com:443",
    linkDisplay: "flechemano.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "flechemano.com",
      label: "Flechemano",
      note: "This is the GateWay!",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261507,
    end: 0
  },
  {
    id: "gLQ1no4xBR9H2hzw7F4fYVA7VI_Z5phiB1t0ZKIH2Go",
    ping: {
      status: "success",
      value: 181
    },
    health: {
      status: "success"
    },
    linkFull: "https://love4src.com:443",
    linkDisplay: "love4src.com",
    operatorStake: 20000,
    vaults: [],
    settings: {
      fqdn: "love4src.com",
      label: "love4src",
      note: "kanshi was here",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261543,
    end: 0
  },
  {
    id: "LY89WeNXvTn_NFT-KVV6HPcPVB5qpSq1ug25TScwlq0",
    ping: {
      status: "success",
      value: 504
    },
    health: {
      status: "success"
    },
    linkFull: "https://mustafakaya.xyz:443",
    linkDisplay: "mustafakaya.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "mustafakaya.xyz",
      label: "RuesGateway",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261659,
    end: 0
  },
  {
    id: "FWHNAxlVelHzf4iAYdAuZtaCO3dQjpvKnsdj-ErhK5U",
    ping: {
      status: "success",
      value: 659
    },
    health: {
      status: "success"
    },
    linkFull: "https://lethuan.xyz:443",
    linkDisplay: "lethuan.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "lethuan.xyz",
      label: "LVT_NODE",
      note: "LVTCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261680,
    end: 0
  },
  {
    id: "GY0MysWAv83ANosil942egXtxMxxlAPEiI1LFF5hxjA",
    ping: {
      status: "success",
      value: 168
    },
    health: {
      status: "success"
    },
    linkFull: "https://0xknowledge.store:443",
    linkDisplay: "0xknowledge.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "0xknowledge.store",
      label: "0xKnowledgEGateway",
      note: "GOD.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261818,
    end: 0
  },
  {
    id: "HLl--bHyBw0-kK64OMp3ymdISNlkQ1ab-W7kZ0G1poU",
    ping: {
      status: "success",
      value: 567
    },
    health: {
      status: "success"
    },
    linkFull: "https://shibamaru.tech:443",
    linkDisplay: "shibamaru.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "shibamaru.tech",
      label: "!Bakaa",
      note: "Eunha Kawai",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261880,
    end: 0
  },
  {
    id: "zZubtFd-X4JDJpLIYQpT6BNp1ZTdXdSEDS-poheGb2A",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://maidyo.xyz:443",
    linkDisplay: "maidyo.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "maidyo.xyz",
      label: "maidyogat",
      note: "maidyonode",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1261920,
    end: 0
  },
  {
    id: "lk2W8J5mj9JDpl22p1WMC05gD7EqWJZbbAgOAswC9xk",
    ping: {
      status: "success",
      value: 167
    },
    health: {
      status: "success"
    },
    linkFull: "https://arweave.fllstck.dev:443",
    linkDisplay: "arweave.fllstck.dev",
    operatorStake: 11500,
    vaults: [],
    settings: {
      fqdn: "arweave.fllstck.dev",
      label: "Fllstck Arweave Gateway",
      note: "A serverless gateway.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1262031,
    end: 0
  },
  {
    id: "x3GW6wfBZ3wHTflETInuzJ5rOv_6JvlFi-dl6yYAr8Y",
    ping: {
      status: "success",
      value: 113
    },
    health: {
      status: "success"
    },
    linkFull: "https://permabridge.com:443",
    linkDisplay: "permabridge.com",
    operatorStake: 20000,
    vaults: [],
    settings: {
      fqdn: "permabridge.com",
      label: "Permabridge",
      note: "PermaBridge",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1262175,
    end: 0
  },
  {
    id: "MTMnfoaDDyFBPy_YV2cVuVU3xEsryGhA9bZDxNVh5_U",
    ping: {
      status: "success",
      value: 202
    },
    health: {
      status: "success"
    },
    linkFull: "https://arbr.pro:443",
    linkDisplay: "arbr.pro",
    operatorStake: 20000,
    vaults: [],
    settings: {
      fqdn: "arbr.pro",
      label: "ArBR",
      note: "Brazilian gateway operated by K.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1264175,
    end: 0
  },
  {
    id: "NrE-g7b_WCSTLNRwJXouBsPWxwXFtF4-lyg5a8Enq8w",
    ping: {
      status: "success",
      value: 81
    },
    health: {
      status: "success"
    },
    linkFull: "https://khaldrogo.site:443",
    linkDisplay: "khaldrogo.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "khaldrogo.site",
      label: "khaldrogogateway",
      note: "Khaldrogo",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1264421,
    end: 0
  },
  {
    id: "RuqD0_TLZ4METrEEkipMvJikb4EHT1MGAiZQwP_cOlw",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://sacittnoderunner.store:443",
    linkDisplay: "sacittnoderunner.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "sacittnoderunner.store",
      label: "sacittGateway",
      note: "sacitt from RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1264540,
    end: 0
  },
  {
    id: "kM6GkV0cBOLSydBI3lxc27j6pfSbRddSPrzgDClOj0s",
    ping: {
      status: "success",
      value: 570
    },
    health: {
      status: "success"
    },
    linkFull: "https://enesss.online:443",
    linkDisplay: "enesss.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "enesss.online",
      label: "enesssGateway",
      note: "Owned and operated by ENESSS.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1264714,
    end: 0
  },
  {
    id: "f3Tb3tt5Ea2rfnopyOqMzE7696NxEaBmZTd2eE3Xrvw",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://cyanalp.cfd:443",
    linkDisplay: "cyanalp.cfd",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "cyanalp.cfd",
      label: "cyanalpgateway",
      note: "ruescommunity.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1264874,
    end: 0
  },
  {
    id: "SZudeTQpLdzbKe2xvwyP2noI2jLjCXjG2bBytK53u_U",
    ping: {
      status: "success",
      value: 549
    },
    health: {
      status: "success"
    },
    linkFull: "https://genesisprime.site:443",
    linkDisplay: "genesisprime.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "genesisprime.site",
      label: "GenesisPrimeGateway",
      note: "Genesis Prime",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1265600,
    end: 0
  },
  {
    id: "jHGSqiQ8IPuPzZLN8ePwO_ddPOz0_C_gauxe-ph3bBU",
    ping: {
      status: "success",
      value: 489
    },
    health: {
      status: "success"
    },
    linkFull: "https://soulbreaker.xyz:443",
    linkDisplay: "soulbreaker.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "soulbreaker.xyz",
      label: "fennarigate",
      note: "RuesRulazz",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1265629,
    end: 0
  },
  {
    id: "qzHXDqnL-1RoWPk9j_C_XkVPIcb4aRmbl7CWe56WVdA",
    ping: {
      status: "success",
      value: 530
    },
    health: {
      status: "success"
    },
    linkFull: "https://alicans.online:443",
    linkDisplay: "alicans.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "alicans.online",
      label: "alicansGate",
      note: "hello world",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1265634,
    end: 0
  },
  {
    id: "FEb4D1yg2owV2dG6TnAdwCULptJm6RbY_sb24VGLrEY",
    ping: {
      status: "success",
      value: 186
    },
    health: {
      status: "success"
    },
    linkFull: "https://mpsnode.online:443",
    linkDisplay: "mpsnode.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "mpsnode.online",
      label: "MPSnode",
      note: "NODE IS MY LIFE.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266050,
    end: 0
  },
  {
    id: "Xce1uGpfkc4owUV6gPQJuJ1xhRu4s_108iVDBDkHIN0",
    ping: {
      status: "success",
      value: 276
    },
    health: {
      status: "success"
    },
    linkFull: "https://itachistore.tech:443",
    linkDisplay: "itachistore.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "itachistore.tech",
      label: "Alucard",
      note: "Profesional Validator",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266071,
    end: 0
  },
  {
    id: "_Ygw-DSOPz3jodxRhTBmt_-T3rUqTGfmCjZWinCAfUA",
    ping: {
      status: "success",
      value: 253
    },
    health: {
      status: "success"
    },
    linkFull: "https://beritacryptoo.me:443",
    linkDisplay: "beritacryptoo.me",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "beritacryptoo.me",
      label: "beritacryptoo",
      note: "https://t.me/BeritaCryptoo",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266087,
    end: 0
  },
  {
    id: "OvH9iy_kV9_lbfyW8_YryyrC1XDohme225_2LbLKnAU",
    ping: {
      status: "success",
      value: 508
    },
    health: {
      status: "success"
    },
    linkFull: "https://arendor.xyz:443",
    linkDisplay: "arendor.xyz",
    operatorStake: 10100,
    vaults: [],
    settings: {
      fqdn: "arendor.xyz",
      label: "arendorgateway",
      note: "there is labor.RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266098,
    end: 0
  },
  {
    id: "sJ191TvtKP1iXbGdk7oisId58XArKZu8hjLsHJUrEVY",
    ping: {
      status: "success",
      value: 1148
    },
    health: {
      status: "success"
    },
    linkFull: "https://ancolclown.xyz:443",
    linkDisplay: "ancolclown.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "ancolclown.xyz",
      label: "ancClown",
      note: "Every Node.js developer was a newbie once, im included.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266098,
    end: 0
  },
  {
    id: "RNuHyrphq5OOpbD4bGTu8po6wFXoLrpj-dey78kaSOs",
    ping: {
      status: "success",
      value: 265
    },
    health: {
      status: "success"
    },
    linkFull: "https://suanggi.live:443",
    linkDisplay: "suanggi.live",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "suanggi.live",
      label: "Betrix",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266098,
    end: 0
  },
  {
    id: "0_JOdz0EvXNspnQtuSgHdDN6gjOTtJ2VrF01NFmHZRM",
    ping: {
      status: "success",
      value: 165
    },
    health: {
      status: "success"
    },
    linkFull: "https://valarian.xyz:443",
    linkDisplay: "valarian.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "valarian.xyz",
      label: "ZaferGateway",
      note: "RuesCommuinty",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266105,
    end: 0
  },
  {
    id: "VQdx5UASaJj_EmTLnqCZUMhVL2Ip1LB0-vkGOfnsvu4",
    ping: {
      status: "success",
      value: 27
    },
    health: {
      status: "success"
    },
    linkFull: "https://gojosatorus.live:443",
    linkDisplay: "gojosatorus.live",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "gojosatorus.live",
      label: "Gojosatoru",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266107,
    end: 0
  },
  {
    id: "xXtdcExIgBtZ6HZpOLDcNcbq_EH89PhDXWaqAK4rjyk",
    ping: {
      status: "success",
      value: 582
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"
    },
    linkFull: "https://maplesyrup-ario.my.id:443",
    linkDisplay: "maplesyrup-ario.my.id",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "maplesyrup-ario.my.id",
      label: "MapleSyrup",
      note: "Rawrr",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266110,
    end: 0
  },
  {
    id: "oMPYwABoGMcrvLAy1r41ilZD5totu7TGm6JuCkW7bL8",
    ping: {
      status: "success",
      value: 533
    },
    health: {
      status: "success"
    },
    linkFull: "https://alpt.autos:443",
    linkDisplay: "alpt.autos",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "alpt.autos",
      label: "cyangate",
      note: "ruescommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266120,
    end: 0
  },
  {
    id: "KjdFZRz3XfMu2E_3KiDuqW0Ye-K70Kr2gbu8Z4S0Ts4",
    ping: {
      status: "success",
      value: 168
    },
    health: {
      status: "success"
    },
    linkFull: "https://moruehoca.online:443",
    linkDisplay: "moruehoca.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "moruehoca.online",
      label: "MorueGate",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266132,
    end: 0
  },
  {
    id: "ZNsUG7VnUdL8-jAChetRPbGwfwD4RFDU1_jA0bsFzLc",
    ping: {
      status: "success",
      value: 576
    },
    health: {
      status: "success"
    },
    linkFull: "https://dasamuka.cloud:443",
    linkDisplay: "dasamuka.cloud",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "dasamuka.cloud",
      label: "dasamuka",
      note: "YOU CANT SEE ME",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266147,
    end: 0
  },
  {
    id: "KG8TlcWk-8pvroCjiLD2J5zkG9rqC6yYaBuZNqHEyY4",
    ping: {
      status: "success",
      value: 235
    },
    health: {
      status: "success"
    },
    linkFull: "https://0xsaitomo.xyz:443",
    linkDisplay: "0xsaitomo.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "0xsaitomo.xyz",
      label: "SaitamaGateway",
      note: "Owned and operated by Saitama.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266158,
    end: 0
  },
  {
    id: "Vvbt-sB1znVH8ONMFUQJo2nBRuDMPasL6E8GQi6kJV4",
    ping: {
      status: "success",
      value: 178
    },
    health: {
      status: "success"
    },
    linkFull: "https://bunyaminbakibaltaci.com:443",
    linkDisplay: "bunyaminbakibaltaci.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "bunyaminbakibaltaci.com",
      label: "bunyaminbakibaltacigateway",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266169,
    end: 0
  },
  {
    id: "HDN0eMb4OpTNAMeClQknzw0S_b9fMGnAaYBGwTWvGFk",
    ping: {
      status: "success",
      value: 158
    },
    health: {
      status: "success"
    },
    linkFull: "https://kagithavlu.store:443",
    linkDisplay: "kagithavlu.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "kagithavlu.store",
      label: "devkralgate",
      note: "RuesCommunity.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266169,
    end: 0
  },
  {
    id: "aE1iTCGOwTvsWZ2UqIYp7uyYrvabHBHDDXK2RnVLCcQ",
    ping: {
      status: "success",
      value: 178
    },
    health: {
      status: "success"
    },
    linkFull: "https://karakura.xyz:443",
    linkDisplay: "karakura.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "karakura.xyz",
      label: "oxa",
      note: "lets work.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266200,
    end: 0
  },
  {
    id: "SCOKnowXkWX27XM84Tk7gEt7mF24Qfdh5J0J4KKPNLY",
    ping: {
      status: "success",
      value: 170
    },
    health: {
      status: "success"
    },
    linkFull: "https://alexxis.store:443",
    linkDisplay: "alexxis.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "alexxis.store",
      label: "alexxisgateway",
      note: "ario",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266226,
    end: 0
  },
  {
    id: "YlprxxUDtRCP2Ewfn5qEOQ0j1w_qLc9R6V6TnZ9HNSU",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://dlzvy.tech:443",
    linkDisplay: "dlzvy.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "dlzvy.tech",
      label: "dlzvy",
      note: "Hello From UK-FAMS DAO.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266429,
    end: 0
  },
  {
    id: "CZjfnPXlBIR4vTVVFhj99VTKp-uVhmgljQpOQqJaLRk",
    ping: {
      status: "success",
      value: 164
    },
    health: {
      status: "success"
    },
    linkFull: "https://200323.xyz:443",
    linkDisplay: "200323.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "200323.xyz",
      label: "bonbonz",
      note: "The best view comes after the hardest climb.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266452,
    end: 0
  },
  {
    id: "AEvcfjcsVgCaNdDZ-Rbl51JycN_TmBBlvjOv9PC4r64",
    ping: {
      status: "success",
      value: 182
    },
    health: {
      status: "success"
    },
    linkFull: "https://sokrates.site:443",
    linkDisplay: "sokrates.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "sokrates.site",
      label: "SokratGateway",
      note: "Sharing is the best RuesCommunity.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266524,
    end: 0
  },
  {
    id: "obbDIY_Tkhjx7uP8VMfaAuv2lUUXpKYUsOkADSf1JL4",
    ping: {
      status: "success",
      value: 246
    },
    health: {
      status: "success"
    },
    linkFull: "https://bicem.xyz:443",
    linkDisplay: "bicem.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "bicem.xyz",
      label: "burcu",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266724,
    end: 0
  },
  {
    id: "ivmQI0ccIeVEQ7mXsgW2-3NCMxq9Wu_CxBcc96m0-qA",
    ping: {
      status: "success",
      value: 234
    },
    health: {
      status: "success"
    },
    linkFull: "https://recepgocmen.xyz:443",
    linkDisplay: "recepgocmen.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "recepgocmen.xyz",
      label: "RexhoGateway",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266729,
    end: 0
  },
  {
    id: "mBH0vX6XX4WzpktK3pSL9zob6QI6DQ0545JjROfzN6o",
    ping: {
      status: "success",
      value: 225
    },
    health: {
      status: "success"
    },
    linkFull: "https://hqt1991.site:443",
    linkDisplay: "hqt1991.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "hqt1991.site",
      label: "Hqt1991",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266729,
    end: 0
  },
  {
    id: "8ydreDOP94hL6prU8N5E1tk87RDQTYRa3jEz66nK21g",
    ping: {
      status: "success",
      value: 25
    },
    health: {
      status: "success"
    },
    linkFull: "https://dexa.space:443",
    linkDisplay: "dexa.space",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "dexa.space",
      label: "Dexanode",
      note: "Dexa its My Anon Name.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266729,
    end: 0
  },
  {
    id: "s4JPHqCNvdVspEYm_BGd8SIRzVvsj9e4bMFcSnnRG5Q",
    ping: {
      status: "success",
      value: 207
    },
    health: {
      status: "success"
    },
    linkFull: "https://anch0r.com:443",
    linkDisplay: "anch0r.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "anch0r.com",
      label: "HODOR",
      note: "Hodor the Gateway Keeper",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266735,
    end: 0
  },
  {
    id: "QZ2QcH1tzb9xjVkpo9HO5fuZNOaJxrcMSykZNk8i2K0",
    ping: {
      status: "success",
      value: 195
    },
    health: {
      status: "success"
    },
    linkFull: "https://kairoz.cloud:443",
    linkDisplay: "kairoz.cloud",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "kairoz.cloud",
      label: "kairoz",
      note: "im hulk.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266802,
    end: 0
  },
  {
    id: "qWLB39Pb89TieUomh--Vx_nN7KObCOuRNQwC_nG_Ywc",
    ping: {
      status: "error",
      error: "AbortError: The user aborted a request."
    },
    health: {
      status: "error"
    },
    linkFull: "https://mfttt11.xyz:443",
    linkDisplay: "mfttt11.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "mfttt11.xyz",
      label: "RuesGateway",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266802,
    end: 0
  },
  {
    id: "JAmilWnUXiVsHBgu8fqh0XiUbirJnL_DLRJMMttYo9Q",
    ping: {
      status: "success",
      value: 41
    },
    health: {
      status: "success"
    },
    linkFull: "https://toglok.xyz:443",
    linkDisplay: "toglok.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "toglok.xyz",
      label: "toglok",
      note: "orang yang paling beruntung adalah orang yang pintar.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266887,
    end: 0
  },
  {
    id: "cwjuA0xZ6xkWv1pZ536WtIsTNOBJqZwgoHBoZTGoP9U",
    ping: {
      status: "success",
      value: 38
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token 'T', \"The page c\"... is not valid JSON"
    },
    linkFull: "https://xnodeer.xyz:443",
    linkDisplay: "xnodeer.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "xnodeer.xyz",
      label: "xnodeer",
      note: "never",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266890,
    end: 0
  },
  {
    id: "9qCpyPrEL870Ky-BbINIe9EyknKC8s9iYBdxu3XJ1zo",
    ping: {
      status: "success",
      value: 186
    },
    health: {
      status: "success"
    },
    linkFull: "https://karakartal.store:443",
    linkDisplay: "karakartal.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "karakartal.store",
      label: "karakartalGateWay",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266937,
    end: 0
  },
  {
    id: "8y0mX32e2Y_GmGcS59KF4cOmMQZeIu5pSDJ07a7RcbU",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://tekin86.online:443",
    linkDisplay: "tekin86.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "tekin86.online",
      label: "tekin86",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266961,
    end: 0
  },
  {
    id: "d4d6UHpkMj9oHbBwP__mmtRYR1W3O3yaoPt2o0BAuN0",
    ping: {
      status: "success",
      value: 209
    },
    health: {
      status: "success"
    },
    linkFull: "https://hellocryptoworld.store:443",
    linkDisplay: "hellocryptoworld.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "hellocryptoworld.store",
      label: "HelloCryptoWorld",
      note: "Owned by Anon, inspired by Rues.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1266989,
    end: 0
  },
  {
    id: "8aMPXg031Glw9cONyv6FMr-gdP57I_OpAq4EZDlWr7g",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://seijinjakka.xyz:443",
    linkDisplay: "seijinjakka.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "seijinjakka.xyz",
      label: "0xsei",
      note: "UHUY! Follow me on https://twitter.com/seijin88",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267096,
    end: 0
  },
  {
    id: "1o-x1R4m6JnWXOPtgAgxd43qsPSn0bzuYs8pFTjfklI",
    ping: {
      status: "success",
      value: 117
    },
    health: {
      status: "success"
    },
    linkFull: "https://arget-macan.tech:443",
    linkDisplay: "arget-macan.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "arget-macan.tech",
      label: "macannode",
      note: "(-_-)",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267373,
    end: 0
  },
  {
    id: "DfAHsCV6dg430I7X6TxjmPiBh2wFgaucyY23xlc1pF0",
    ping: {
      status: "success",
      value: 210
    },
    health: {
      status: "success"
    },
    linkFull: "https://terminatormbd.com:443",
    linkDisplay: "terminatormbd.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "terminatormbd.com",
      label: "terminatormbdGateway",
      note: "thanks thecoldblooded ;)",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267487,
    end: 0
  },
  {
    id: "qst-KNfs5a9Dd5qMhVwqN2RDBmczq-5i1A5ouUU5hqI",
    ping: {
      status: "success",
      value: 170
    },
    health: {
      status: "success"
    },
    linkFull: "https://2sconsulting.site:443",
    linkDisplay: "2sconsulting.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "2sconsulting.site",
      label: "2sgate",
      note: "O&O DolphinBoy.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267572,
    end: 0
  },
  {
    id: "1ysyywxH2-rWlaoA5FBt6FmmWwdmsL1LjJRAuKYKYUM",
    ping: {
      status: "success",
      value: 249
    },
    health: {
      status: "success"
    },
    linkFull: "https://nodeinvite.xyz:443",
    linkDisplay: "nodeinvite.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "nodeinvite.xyz",
      label: "NodeInvite",
      note: "NodeInvite",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267607,
    end: 0
  },
  {
    id: "pXcARdI9yhI4uOXwcxCuhdbkdatMVcw7r6mObh5pC_A",
    ping: {
      status: "error",
      error: "TypeError: Failed to fetch"
    },
    health: {
      status: "error"
    },
    linkFull: "https://permanence-testing.org:443",
    linkDisplay: "permanence-testing.org",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "permanence-testing.org",
      label: "Test Gateway",
      note: "Ur note here",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267639,
    end: 0
  },
  {
    id: "xZhc3PBR6GfKCjiQFRjWKI_o3sPgr1aGy1dZIz5tkM0",
    ping: {
      status: "success",
      value: 281
    },
    health: {
      status: "success"
    },
    linkFull: "https://faskal-io.store:443",
    linkDisplay: "faskal-io.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "faskal-io.store",
      label: "kall",
      note: "()()====D",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267650,
    end: 0
  },
  {
    id: "Fe6W6WsU9RifmUe_R1uxoH4hEXMPxHlBt6WiC4wTEcs",
    ping: {
      status: "success",
      value: 270
    },
    health: {
      status: "error",
      error:
        "SyntaxError: Unexpected token '<', \"<html>\r\n<h\"... is not valid JSON"
    },
    linkFull: "https://apramweb.tech:443",
    linkDisplay: "apramweb.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "apramweb.tech",
      label: "Apramgate",
      note: "Provided by Quadblock, operated by Aprame. visit our website: https://quadblock.net",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267805,
    end: 0
  },
  {
    id: "XwO2tGSO_NLvTaUHycLAeTb-wbO0s1T6eKsLkxGeZkA",
    ping: {
      status: "success",
      value: 277
    },
    health: {
      status: "success"
    },
    linkFull: "https://revlv.tech:443",
    linkDisplay: "revlv.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "revlv.tech",
      label: "revlv",
      note: "MAMA FAMS",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267930,
    end: 0
  },
  {
    id: "tSwLFf7FQ0ChZq0De5m65AkjMcRXDt_F-5heu6sJV8Q",
    ping: {
      status: "success",
      value: 195
    },
    health: {
      status: "success"
    },
    linkFull: "https://vikanren.xyz:443",
    linkDisplay: "vikanren.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "vikanren.xyz",
      label: "vikanren",
      note: "Ur note here",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1267986,
    end: 0
  },
  {
    id: "uoEV6kakcWARUB7B-iinvyy5Td8S-WnaFf5tsI5QoQc",
    ping: {
      status: "success",
      value: 272
    },
    health: {
      status: "success"
    },
    linkFull: "https://xiaocloud.site:443",
    linkDisplay: "xiaocloud.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "xiaocloud.site",
      label: "Xiao Cloud Gateware",
      note: "Power by dinah64ls - xiaocloud.site",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268002,
    end: 0
  },
  {
    id: "SIWy4zGVZFGhGoE01GpJ4MA3WG3r7dPFHingDWR5xT0",
    ping: {
      status: "success",
      value: 266
    },
    health: {
      status: "success"
    },
    linkFull: "https://arlogmein.xyz:443",
    linkDisplay: "arlogmein.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "arlogmein.xyz",
      label: "arlogmein",
      note: "ArLogmein Community",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268035,
    end: 0
  },
  {
    id: "3hM8FqD3Yy1iwZ6Tm45CshzP-ZMRBm3mPdgYPg2PHR4",
    ping: {
      status: "success",
      value: 221
    },
    health: {
      status: "success"
    },
    linkFull: "https://coolqas.tech:443",
    linkDisplay: "coolqas.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "coolqas.tech",
      label: "Yuhuu",
      note: "Owned and operated by DTF.",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268152,
    end: 0
  },
  {
    id: "6KTw1-wnlH9Oq2bs6n8OIxMQiaySXddccEDAbS6jn0E",
    ping: {
      status: "success",
      value: 391
    },
    health: {
      status: "success"
    },
    linkFull: "https://planqmyworld.tech:443",
    linkDisplay: "planqmyworld.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "planqmyworld.tech",
      label: "TUKIMIN",
      note: "Ur note here",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268159,
    end: 0
  },
  {
    id: "A1u2AN3h9pAMF6lAdWVbyGa-BhLkz1rIb3T8egX0Bu8",
    ping: {
      status: "success",
      value: 89
    },
    health: {
      status: "success"
    },
    linkFull: "https://nano-nano-io.tech:443",
    linkDisplay: "nano-nano-io.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "nano-nano-io.tech",
      label: "nano-nano",
      note: "()()=====D",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268190,
    end: 0
  },
  {
    id: "L4FSGbVJwaPV4yw0EVRSMgJuLgfVbDkbYlMpXQBMwYM",
    ping: {
      status: "success",
      value: 256
    },
    health: {
      status: "success"
    },
    linkFull: "https://nodevietnam.com:443",
    linkDisplay: "nodevietnam.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "nodevietnam.com",
      label: "Node Validator VietNam™",
      note: "Power by Node & Validator VietNam Community",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268341,
    end: 0
  },
  {
    id: "HdO4fJeBMkQPnLZ6ZPa34-ePPmvWgPxJONqB4pjcXi8",
    ping: {
      status: "success",
      value: 195
    },
    health: {
      status: "success"
    },
    linkFull: "https://bizer744.online:443",
    linkDisplay: "bizer744.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "bizer744.online",
      label: "andalanode",
      note: "Ur note here",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268486,
    end: 0
  },
  {
    id: "rBDcEc9tta9SFt76xmrK20CxfcZO1Aib2DllsXdTrk4",
    ping: {
      status: "success",
      value: 278
    },
    health: {
      status: "success"
    },
    linkFull: "https://polkasub.site:443",
    linkDisplay: "polkasub.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "polkasub.site",
      label: "Polkasub Gateway™",
      note: "Ar-io & Polkadot Connection People",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268720,
    end: 0
  },
  {
    id: "-Tk2DDk8k4zkwtppp_XFKKI5oUgh6IEHygAoN7mD-w8",
    ping: {
      status: "success",
      value: 185
    },
    health: {
      status: "success"
    },
    linkFull: "https://luutong.space:443",
    linkDisplay: "luutong.space",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "luutong.space",
      label: "Node Runner™",
      note: "Node Runner",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268720,
    end: 0
  },
  {
    id: "PmQw9ZxpLONda5RJWi_Urt-w_koiMViLDrDFqhKDRBU",
    ping: {
      status: "success",
      value: 259
    },
    health: {
      status: "success"
    },
    linkFull: "https://getblock.store:443",
    linkDisplay: "getblock.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "getblock.store",
      label: "GETBLOCKSTORE™",
      note: "GETBLOCKSTORE 2023",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268720,
    end: 0
  },
  {
    id: "ffzEKElAfxAn6Uex_A4qty9pZ-SYTFRL8G5y1p0eX5A",
    ping: {
      status: "success",
      value: 167
    },
    health: {
      status: "success"
    },
    linkFull: "https://pepebitrum.xyz:443",
    linkDisplay: "pepebitrum.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "pepebitrum.xyz",
      label: "vikitoshi",
      note: "need more coffee",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268763,
    end: 0
  },
  {
    id: "R0EfFUE-1esQaByakRdIoHgoqq4pwY67RvcVk8VD5OU",
    ping: {
      status: "success",
      value: 447
    },
    health: {
      status: "success"
    },
    linkFull: "https://gnodetop.store:443",
    linkDisplay: "gnodetop.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "gnodetop.store",
      label: "GnodeGateway",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268793,
    end: 0
  },
  {
    id: "qWoZ4fEBygW4P0vOBVGXK8yYYh9N8s2eir1WEU-syPo",
    ping: {
      status: "success",
      value: 198
    },
    health: {
      status: "success"
    },
    linkFull: "https://exmod.online:443",
    linkDisplay: "exmod.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "exmod.online",
      label: "ex-mod",
      note: "Bang Turu bang , jaga kesehatanmu",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268810,
    end: 0
  },
  {
    id: "Voy243ACvvmHnx02OnJXn14Jm9VaXkQ5QGroRSQuQCk",
    ping: {
      status: "success",
      value: 183
    },
    health: {
      status: "success"
    },
    linkFull: "https://ar-getbeyour.fun:443",
    linkDisplay: "ar-getbeyour.fun",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "ar-getbeyour.fun",
      label: "zhuannode",
      note: "kamu nanyaaaa? bertanya tanyaaaa?",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1268844,
    end: 0
  },
  {
    id: "i4YmQ7o5qp65ea1CQd82QAeH9a_bHT6Q8ZZ_qkUD_DQ",
    ping: {
      status: "success",
      value: 253
    },
    health: {
      status: "success"
    },
    linkFull: "https://parkdongfeng.store:443",
    linkDisplay: "parkdongfeng.store",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "parkdongfeng.store",
      label: "Park Dong Feng Public Gate�",
      note: "admin@parkdongfeng.store",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1269402,
    end: 0
  },
  {
    id: "SKdRjJXQZPSILOG3xlzySQZTwsvj17aNkzwia4M1ztI",
    ping: {
      status: "success",
      value: 190
    },
    health: {
      status: "success"
    },
    linkFull: "https://dvvalopers.xyz:443",
    linkDisplay: "dvvalopers.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "dvvalopers.xyz",
      label: "JATIM-pro.tech",
      note: "NODE EAZU SQWEZYY",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1269569,
    end: 0
  },
  {
    id: "qZ90I67XG68BYIAFVNfm9PUdM7v1XtFTn7u-EOZFAtk",
    ping: {
      status: "success",
      value: 254
    },
    health: {
      status: "success"
    },
    linkFull: "https://lobosqlinc.site:443",
    linkDisplay: "lobosqlinc.site",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "lobosqlinc.site",
      label: "Lobosql Inc",
      note: "Copy Right Lobosql Inc - Power By Ar.io",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1269679,
    end: 0
  },
  {
    id: "Mdw4kcMu-E44gAdvYHeeur3MeFsCBtN2MAu2OKjyLZI",
    ping: {
      status: "success",
      value: 250
    },
    health: {
      status: "success"
    },
    linkFull: "https://cakonline.xyz:443",
    linkDisplay: "cakonline.xyz",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "cakonline.xyz",
      label: "cakonline gateway",
      note: "RuesCommunity",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1269785,
    end: 0
  },
  {
    id: "9aAYXRjJCtn6vOfaswUaXP5Zz-Fnu7JFwNsPrJit42s",
    ping: {
      status: "success",
      value: 222
    },
    health: {
      status: "success"
    },
    linkFull: "https://dwifahrisal.online:443",
    linkDisplay: "dwifahrisal.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "dwifahrisal.online",
      label: "dwifahrisal",
      note: "Imagine all the people living life in peace",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270094,
    end: 0
  },
  {
    id: "66TtqNvIzwwW1ynaplqQeGVsq3HtH9NOrqrCM3TnZgA",
    ping: {
      status: "success",
      value: 249
    },
    health: {
      status: "success"
    },
    linkFull: "https://misatoshi.pics:443",
    linkDisplay: "misatoshi.pics",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "misatoshi.pics",
      label: "Who is Satoshi",
      note: "Thank you ruesandora for Ar Guild Install",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270108,
    end: 0
  },
  {
    id: "0MZpCd-wWXhayK38ZJ5TCtN9gKDYHkhoV5xtA9eNAHQ",
    ping: {
      status: "success",
      value: 254
    },
    health: {
      status: "success"
    },
    linkFull: "https://zirhelp.lol:443",
    linkDisplay: "zirhelp.lol",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "zirhelp.lol",
      label: "Zirhelp Gateway",
      note: "Creat by Ar.Io Zirhelp Gateway",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270108,
    end: 0
  },
  {
    id: "C22G2N9e-w-ggjWRpE29rkK1GlPRNygEA6uSWLsE3w4",
    ping: {
      status: "success",
      value: 252
    },
    health: {
      status: "success"
    },
    linkFull: "https://konobbeybackend.online:443",
    linkDisplay: "konobbeybackend.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "konobbeybackend.online",
      label: "Kono Permagate",
      note: "Power by Kono",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270109,
    end: 0
  },
  {
    id: "dD8lEdhTu3ruVPBnzynLMzaXY179YIYz_QS9_LuMRXg",
    ping: {
      status: "success",
      value: 213
    },
    health: {
      status: "success"
    },
    linkFull: "https://ar.ionode.online:443",
    linkDisplay: "ar.ionode.online",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "ar.ionode.online",
      label: "IONode.Online",
      note: "Professional PoS Network Validator, Highly Secured and 24/7 Monitored",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270150,
    end: 0
  },
  {
    id: "zpwUxIJgsB1Rko-UYINmI0mGx1R24aUuZ7cXhJbON6A",
    ping: {
      status: "success",
      value: 199
    },
    health: {
      status: "success"
    },
    linkFull: "https://leechshop.com:443",
    linkDisplay: "leechshop.com",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "leechshop.com",
      label: "KaiGateway",
      note: "Powered by KaiKiseN",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270214,
    end: 0
  },
  {
    id: "DdpnQbt3T3N3iGSVpg0e05oTiOQhGGejwDF5UO0PqeM",
    ping: {
      status: "success",
      value: 87
    },
    health: {
      status: "success"
    },
    linkFull: "https://thd.io.vn:443",
    linkDisplay: "thd.io.vn",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "thd.io.vn",
      label: "ADORA gateway",
      note: "Your keys, Your coins, Your stakes",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270244,
    end: 0
  },
  {
    id: "fWZTj0drIFm_GGi2asKi1C3eHiije15djQu7-TqJo58",
    ping: {
      status: "success",
      value: 181
    },
    health: {
      status: "success"
    },
    linkFull: "https://sipalingnode.tech:443",
    linkDisplay: "sipalingnode.tech",
    operatorStake: 10000,
    vaults: [],
    settings: {
      fqdn: "sipalingnode.tech",
      label: "AlldiiRamadhan",
      note: "jangan biarkan orang lain mengubahmu, tapi buatlah mereka kagum dengan dirimu sendiri",
      properties: "FH1aVetOoulPGqgYukj0VE0wIhDy90WiQoV3U2PeY44",
      protocol: "https",
      port: 443
    },
    status: "joined",
    start: 1270286,
    end: 0
  }
];
