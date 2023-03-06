import arverifyLogo from "url:/assets/ecosystem/arverify.svg";
import ardriveLogo from "url:/assets/ecosystem/ardrive.svg";
import vertoLogo from "url:/assets/ecosystem/verto.png";
import pianityLogo from "url:/assets/ecosystem/pianity.png";
import decentlandLogo from "url:/assets/ecosystem/decentland.png";
import glassLogo from "url:/assets/ecosystem/glass.png";
import sarcophagusLogo from "url:/assets/ecosystem/sarcophagus.png";
import checkmynftLogo from "url:/assets/ecosystem/checkmynft.png";
import weveLogo from "url:/assets/ecosystem/weve.png";
import argoLogo from "url:/assets/ecosystem/argo.png";
import communityxyzLogo from "url:/assets/ecosystem/communityxyz.png";
import argoraLogo from "url:/assets/ecosystem/argora.png";
import redstoneLogo from "url:/assets/ecosystem/redstone.svg";
import arwikiLogo from "url:/assets/ecosystem/arwiki.png";
import pocketnetworkLogo from "url:/assets/ecosystem/pocketnetwork.png";
import permabotLogo from "url:/assets/ecosystem/permabot.png";
import wisdomwizardsLogo from "url:/assets/ecosystem/wisdomwizards.png";
import viewblockLogo from "url:/assets/ecosystem/viewblock.png";
import mirrorLogo from "url:/assets/ecosystem/mirror.jpeg";
import amplifyLogo from "url:/assets/ecosystem/amplify.png";
import aftrmarketLogo from "url:/assets/ecosystem/aftrmarket.png";
import gitcoinLogo from "url:/assets/ecosystem/gitcoin.svg";
import arconnectLogo from "url:/assets/ecosystem/arconnect.png";
import ecclesiaLogo from "url:/assets/ecosystem/ecclesia.jpeg";
import arweavenewsLogo from "url:/assets/ecosystem/arweavenews.jpeg";
import kyveLogo from "url:/assets/ecosystem/kyve.svg";
import nestlandLogo from "url:/assets/ecosystem/nestland.jpeg";
import evermoreLogo from "url:/assets/ecosystem/evermore.png";
import Marquee from "react-fast-marquee";
import styled from "styled-components";

export default function Ecosystem() {
  const images = apps();

  return (
    <Wrapper>
      {[20, 15, 20].map((speed, s) => (
        <Marquee
          speed={speed}
          key={s}
          direction={!(s % 2) ? "left" : "right"}
          gradientWidth={50}
          pauseOnHover
          style={{ minWidth: "max-content" }}
        >
          {images.slice(s * 10, (s + 1) * 10).map((img, i) => (
            <AppLogo src={img} key={i} />
          ))}
        </Marquee>
      ))}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  overflow: hidden;
  top: 4rem;
  left: 0;
  right: 0;
  height: 60%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  z-index: -10;
`;

const AppLogo = styled.img.attrs({
  draggable: false
})`
  user-select: none;
  height: 6rem;
  margin: 0 4.5rem;
`;

const apps = () =>
  [
    arverifyLogo,
    ardriveLogo,
    vertoLogo,
    pianityLogo,
    decentlandLogo,
    glassLogo,
    sarcophagusLogo,
    checkmynftLogo,
    weveLogo,
    argoLogo,
    communityxyzLogo,
    argoraLogo,
    redstoneLogo,
    arwikiLogo,
    pocketnetworkLogo,
    permabotLogo,
    wisdomwizardsLogo,
    viewblockLogo,
    mirrorLogo,
    amplifyLogo,
    aftrmarketLogo,
    gitcoinLogo,
    arconnectLogo,
    ecclesiaLogo,
    arweavenewsLogo,
    kyveLogo,
    nestlandLogo,
    evermoreLogo
  ].sort(() => Math.random() - 0.5);
