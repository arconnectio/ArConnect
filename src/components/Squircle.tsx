import { HTMLProps, useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

export default function Squircle({
  children,
  img,
  ...props
}: HTMLProps<HTMLDivElement> & Props) {
  const [imageData, setImageData] = useState<string>();

  // load the image with axios
  // we use this to have a nicer loading
  // because otherwise the background looks
  // weird for a second
  useEffect(() => {
    (async () => {
      const { data, headers } = await axios.get(img, {
        responseType: "arraybuffer"
      });
      const base64 = Buffer.from(data, "binary").toString("base64");
      const prefix = "data:" + headers["content-type"] + ";base64, ";

      // append the base64 image string
      setImageData(prefix + base64);
    })();
  }, [img]);

  return (
    <Wrapper {...(props as any)}>
      <SquircleSvg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {imageData && (
          <defs>
            <pattern
              id="squircle"
              patternUnits="userSpaceOnUse"
              width="60"
              height="60"
            >
              <image
                xlinkHref={imageData}
                x="0"
                y="0"
                width="60"
                height="60"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          </defs>
        )}
        <path
          d="M0 30C0 5.295 5.295 0 30 0C54.705 0 60 5.295 60 30C60 54.705 54.705 60 30 60C5.295 60 0 54.705 0 30Z"
          fill={imageData ? "url(#squircle)" : "currentColor"}
        />
      </SquircleSvg>
      {children}
    </Wrapper>
  );
}

interface Props {
  img?: string;
}

const Wrapper = styled.div`
  position: relative;
  width: 1rem;
  height: 1rem;
  color: rgb(${(props) => props.theme.theme});
`;

const SquircleSvg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
