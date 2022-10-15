import type { HTMLProps } from "react";
import styled from "styled-components";

export default function Squircle({
  children,
  img,
  ...props
}: HTMLProps<HTMLDivElement> & Props) {
  return (
    <Wrapper {...(props as any)}>
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {img && (
          <defs>
            <pattern
              id="squircle"
              patternUnits="userSpaceOnUse"
              width="200"
              height="200"
            >
              <image xlinkHref={img} x="0" y="0" width="200" height="200" />
            </pattern>
          </defs>
        )}
        <path
          d="M0 30C0 5.295 5.295 0 30 0C54.705 0 60 5.295 60 30C60 54.705 54.705 60 30 60C5.295 60 0 54.705 0 30Z"
          fill={img ? "url(#squircle)" : "currentColor"}
        />
      </svg>
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

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;
