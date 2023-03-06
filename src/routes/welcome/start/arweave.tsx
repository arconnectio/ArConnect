import { motion } from "framer-motion";
import styled from "styled-components";

// inspired by arweave.org
export default function Arweave() {
  const images = Array(27)
    .fill("")
    .map(
      (_, i) =>
        `https://arweave.net/znt7SIsoHyYA28BBiPXquYnk2jtxraLKeVTBEp1e3XA/${
          i + 1
        }.jpg`
    )
    .sort(() => 0.5 - Math.random());

  return (
    <Wrapper>
      {images.map((src, i) => (
        <Hexagon
          src={src}
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 - Math.floor(i / 10) * 0.2 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.23,
            ease: "easeInOut",
            delay: Math.random() * (3 - 0.12) + 0.12
          }}
        />
      ))}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  left: -5%;
  right: -5%;
  bottom: -5%;
  top: -5%;
  width: 110%;
  height: 110%;
  z-index: -10;
  overflow: hidden;
`;

const Hexagon = styled(motion.div)<{ src: string }>`
  display: list-item;
  background-image: url(${(props) => props.src});
  background-repeat: no-repeat;
  background-size: cover;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  float: left;
  width: 10%;
  padding-top: 10%;
  margin: 7px;

  &:nth-child(18n + 10),
  &:nth-child(18n + 11),
  &:nth-child(18n + 12),
  &:nth-child(18n + 13),
  &:nth-child(18n + 14),
  &:nth-child(18n + 15),
  &:nth-child(18n + 16),
  &:nth-child(18n + 17),
  &:nth-child(18n + 18) {
    margin-top: -2.5%;
    margin-bottom: -2.5%;
    transform: translateX(calc(50% + 7px));
  }
`;
