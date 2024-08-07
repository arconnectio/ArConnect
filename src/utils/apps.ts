import alexLogo from "url:/assets/ecosystem/alex.svg";
import ardriveLogo from "url:/assets/ecosystem/ardrive.svg";
import aftrmarketLogo from "url:/assets/ecosystem/aftrmarket.png";
import arwikiLogo from "url:/assets/ecosystem/arwiki.png";
import bazarLogo from "url:/assets/ecosystem/bazar.png";
import protocollandLogo from "url:/assets/ecosystem/protocolland.svg";
import permaswapLogo from "url:/assets/ecosystem/permaswap.svg";
import barkLogo from "url:/assets/ecosystem/bark.png";
import arnsLogo from "url:/assets/ecosystem/arns.svg";
import astroLogo from "url:/assets/ecosystem/astro.png";
import permapagesLogo from "url:/assets/ecosystem/permapages.svg";
import dexiLogo from "url:/assets/ecosystem/dexi.svg";
import dcaAgentLogo from "url:/assets/ecosystem/autonomous-dca-agent.png";
import aoLinkLogo from "url:/assets/ecosystem/aolink.svg";
import llamaLogo from "url:/assets/ecosystem/llama.png";
import arswapLogo from "url:/assets/ecosystem/arswap.png";
import liquidopsLogo from "url:/assets/ecosystem/liquidops.svg";
import betterideaLogo from "url:/assets/ecosystem/betteridea.png";

export interface App {
  name: string;
  category: string;
  description: string;
  assets: {
    logo: string;
    thumbnail: string;
    lightBackground?: string;
    darkBackground?: string;
  };
  links: {
    website: string;
    twitter?: string;
    discord?: string;
    github?: string;
  };
}

export const apps: App[] = [
  {
    name: "Bark",
    category: "Exchange",
    description: "Bark is the AO Computer's first decentralized exchange.",
    assets: {
      logo: barkLogo,
      thumbnail: "/apps/bark/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://bark.arweave.dev"
    }
  },
  {
    name: "Protocol.Land",
    category: "Storage",
    description:
      "Protocol.Land is a decentralized home for decentralized codebases.",
    assets: {
      logo: protocollandLogo,
      thumbnail: "/apps/protocolland/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://protocol.land",
      twitter: "https://twitter.com/ProtocolLand",
      discord: "https://discord.com/invite/GqxX2vtwRj",
      github: "https://github.com/labscommunity/protocol-land"
    }
  },
  {
    name: "Astro",
    category: "Defi",
    description:
      "Astro introduces USDA as the first overcollateralized stablecoin on AO.",
    assets: {
      logo: astroLogo,
      thumbnail: "/apps/astro/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://astrousd.com",
      twitter: "https://twitter.com/AstroUSD",
      discord: "https://discord.gg/NpNRtNE6PN"
    }
  },
  {
    name: "LiquidOps",
    category: "Defi",
    description:
      "A simple, secure lending & borrowing platform for AR & AO assets.",
    assets: {
      logo: liquidopsLogo,
      thumbnail: "/apps/astro/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://www.liquidops.io",
      twitter: "https://x.com/Liquid_Ops"
    }
  },
  {
    name: "Bazar",
    category: "Exchange",
    description:
      "The first fully decentralized atomic asset exchange built on the permaweb. Through the power of the Universal Content Marketplace (UCM) protocol and the Universal Data License (UDL) content creators can trade digital assets with real world rights.",
    assets: {
      logo: bazarLogo,
      thumbnail: "/apps/bazar/thumbnail.gif",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://bazar.arweave.dev",
      twitter: "https://twitter.com/OurBazAR"
    }
  },
  {
    name: "AFTR Market",
    category: "Infrastructure",
    description:
      "AFTR Market provides asset management and governance on-chain for Arweave assets.",
    assets: {
      logo: aftrmarketLogo,
      thumbnail: "/apps/aftr/thumbnail.png"
    },
    links: {
      website: "https://www.aftr.market/",
      twitter: "https://twitter.com/AftrMarket",
      discord: "https://discord.gg/YEy8VpuNXR"
    }
  },
  {
    name: "Dexi",
    category: "Defi",
    description:
      "Dexi autonomously identifies, collects, and aggregates financial data from events within the AO network, including asset prices, token swaps, liquidity fluctuations, and token asset characteristics.",
    assets: {
      logo: dexiLogo,
      thumbnail: "/apps/dexi/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://dexi.arweave.dev/",
      twitter: "https://x.com/autonomous_af"
    }
  },
  {
    name: "Autonomous DCA Agent",
    category: "Agent",
    description:
      "The Autonomous DCA Agent executes a dynamic dollar-cost-average (DCA) investment strategy across various liquidity pools within the AO ecosystem.",
    assets: {
      logo: dcaAgentLogo,
      thumbnail: "/apps/autonomousdca/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://dca_agent.arweave.dev/",
      twitter: "https://x.com/autonomous_af"
    }
  },
  {
    name: "ao Link",
    category: "Developer Tooling",
    description:
      "ao.link serves as a message explorer for the ao Network, offering functionalities similar to block explorers in conventional blockchain systems.",
    assets: {
      logo: aoLinkLogo,
      thumbnail: "/apps/aolink/logo.png",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://www.ao.link/",
      twitter: "https://x.com/TheDataOS"
    }
  },
  {
    name: "Llama Land",
    category: "Social",
    description:
      "AI powered MMO game built on AO. Petition the Llama King for Llama Coin! 100% onchain.",
    assets: {
      logo: llamaLogo,
      thumbnail: "/apps/llamaland/logo.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://llamaland.g8way.io/#/",
      twitter: "https://x.com/LlamaLandAO"
    }
  },
  {
    name: "ArSwap",
    category: "Exchange",
    description:
      "Unlocking DeFi on AO. Swap tokens, provide liquidity, and earn fees.",
    assets: {
      logo: arswapLogo,
      thumbnail: "/apps/arswap/logo.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://arswap.org/",
      twitter: "https://x.com/ar_swap"
    }
  },
  {
    name: "Arweave Name System",
    category: "Social",
    description:
      "The Arweave Name System (ArNS) works similarly to traditional Domain Name Services - but with ArNS, the registry is decentralized, permanent, and stored on Arweave. It's a simple way to name and help you - and your users - find your data, apps, or websites on Arweave.",
    assets: {
      logo: arnsLogo,
      thumbnail: "/apps/arns/thumbnail.jpeg",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://arns.app",
      twitter: "https://twitter.com/ar_io_network",
      discord: "https://discord.com/invite/HGG52EtTc2",
      github: "https://github.com/ar-io"
    }
  },
  {
    name: "Permapages",
    category: "Publishing",
    description:
      "Create and manage your own permanent web3 profile and permaweb pages built on Arweave.",
    assets: {
      logo: permapagesLogo,
      thumbnail: "/apps/permapages/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://permapages.app",
      twitter: "https://twitter.com/permapages"
    }
  },
  {
    name: "ArDrive",
    category: "Storage",
    description:
      "ArDrive offers never-ending storage of your most valuable files. Pay once and save your memories forever.",
    assets: {
      logo: ardriveLogo,
      thumbnail: permaswapLogo,
      lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://ardrive.io",
      twitter: "https://twitter.com/ardriveapp",
      discord: "https://discord.com/invite/ya4hf2H",
      github: "https://github.com/ardriveapp"
    }
  },
  {
    name: "BetterIDEa",
    category: "Developer Tooling",
    description: "Feature rich web IDE for building on AO",
    assets: {
      logo: betterideaLogo,
      thumbnail: "/apps/betteridea/thumbnail.png",
      lightBackground: "rgba(240, 240, 240, 1)",
      darkBackground: "rgba(20, 34, 19, 1)"
    },
    links: {
      website: "https://betteridea.arweave.net/",
      twitter: "https://twitter.com/betteridea_dev",
      discord: "https://discord.gg/nm6VKUQBrA",
      github: "https://github.com/betteridea-dev"
    }
  },
  {
    name: "Arwiki",
    category: "Social",
    description:
      "As MediaWiki is the software that powers Wikipedia, ArWiki is the software that powers the Arweave Wiki. However, ArWiki is a Web3 platform -- it is completely decentralized, and is hosted on and served from the Arweave permaweb itself.",
    assets: {
      logo: arwikiLogo,
      thumbnail: "/apps/arwiki/thumbnail.jpeg",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://arwiki.wiki",
      twitter: "https://x.com/TheArWiki"
    }
  },
  {
    name: "Alex",
    category: "Storage",
    description:
      "A decentralized archival platform that preserves human history and culture digitally.",
    assets: {
      logo: alexLogo,
      thumbnail: "/apps/alex/thumbnail.png",
      lightBackground: "rgba(230, 235, 240, 1)"
    },
    links: {
      website: "https://alex.arweave.dev/",
      twitter: "https://twitter.com/thealexarchive",
      discord: "http://discord.gg/2uZsWuTNvN"
    }
  },
  {
    name: "Permaswap",
    category: "Exchange",
    description:
      "Permaswap is an engineering innovation to refactor AMM. Inspired by Arweave's SmartWeave, we've proposed the SCP theory. By exploring SCP, we're certain that the approach to building decentralized applications is not limited to the on-chain VM model and that the future of Dapp development will be diverse. The Permaswap Network will prove with a new architecture that decentralization should break the impossible triangle and provide users with a perfect experience.",
    assets: {
      logo: permaswapLogo,
      thumbnail: permaswapLogo,
      // lightBackground: "rgba(230, 235, 240, 1)",
      darkBackground: "rgba(19, 28, 37, 1)"
    },
    links: {
      website: "https://permaswap.network/",
      twitter: "https://twitter.com/permaswap",
      discord: "https://discord.gg/WM5MQZGVPF",
      github: "https://github.com/permaswap"
    }
  }
];
