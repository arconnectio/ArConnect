const addressRegex = /^[a-z0-9-_]{43}$/i;

type svgieOptions = {
  asDataURI?: boolean;
  size?: number;
  seed?: string;
};

export const arSvgie = async (address: string, opts?: svgieOptions) => {
  if (!address || address.length !== 43 || !addressRegex.test(address)) return;

  const { asDataURI = false, size: dimension = 32, seed = "" } = opts;

  if (dimension < 1) return;
  const base64Address = address.replace(/-/g, "+").replace(/_/g, "/") + "==";
  const bytesAddress = new Uint8Array(Buffer.from(base64Address, "base64"));

  const hashedBytes = await getHashedBytes(base64Address, seed);

  const paths = getSPaths(bytesAddress.slice(0, 20));
  const colors = getColors(hashedBytes);

  const svg = getSVG(dimension, colors, paths);

  if (asDataURI) return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return svg;
};

const getHashedBytes = async (address: string, seed?: string) => {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address + (seed ? seed : ""))
  );
  return new Uint8Array(hashBuffer);
  //   const base64 = address.replace(/-/g, "+").replace(/_/g, "/") + "==";
  //   return Buffer.from(base64, "base64");
};

const getSPaths = (bytes20) => {
  // build number arrays (original and symmetrical)
  const arr = [];
  const symArr = [];
  for (let i = 0; i < bytes20.length; i++) {
    const byte = bytes20[i];
    const highNibble = ((byte >> 4) & 0x0f) + 8;
    const lowNibble = (byte & 0x0f) + 8;
    arr.push(highNibble);
    arr.push(lowNibble);
    symArr.push(32 - highNibble);
    symArr.push(lowNibble);
  }
  //   const arr = bytes?.split("").map((char) => parseInt(char, 16) + 8);
  //   let symArr = arr?.map((val, index) => (index % 2 ? val : 32 - val));
  return [getSPath(arr), getSPath(symArr)];
};

// Creates a path from an array with all the control points defined
const getSPath = (arr) => {
  // First coordinates are the path start point
  let path = `M${arr[0]} ${arr[1]}`;
  // Every 2 coordinate pair, a Cubic Bézier S Curve goes into the path
  path += `C${arr[2]} ${arr[3]} ${arr[4]} ${arr[5]} ${arr[6]} ${arr[7]}`;
  for (let i = 8; i < arr.length; i += 4) {
    path += `S${arr[i]} ${arr[i + 1]} ${arr[i + 2]} ${arr[i + 3]}`;
  }
  // Last coordinate pair is used as control point for the last Bézier Curve
  // path += `S${2 * arr[0] - arr[2]} ${2 * arr[1] - arr[3]} ${arr[0]} ${arr[1]}z`
  path += `Q${2 * arr[arr.length - 2] - arr[arr.length - 4]} ${
    2 * arr[arr.length - 1] - arr[arr.length - 3]
  } ${arr[0]} ${arr[1]}z`;
  return path;
};

// Split bytes into hex colors (every 4 bytes) to create rgba colors
const getColors = (bytes) => {
  const fixedOpacity = bytes.map((b, i) => (i % 4 !== 3 ? b : (b >> 2) + 191));
  const hexColors = [];
  let hexString = "";
  for (let i = 0; i < fixedOpacity.length; i++) {
    hexString += ("0" + fixedOpacity[i].toString(16)).slice(-2);
    if (i % 4 === 3) {
      hexColors.push(hexString);
      hexString = "";
    }
  }
  return hexColors;
};

const getSVG = (dimension: number, c: string[], p: string[]) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${dimension}" height="${dimension}">
    <radialGradient id="ab">
        <stop stop-color="#${c[0]}" offset="0" />
        <stop stop-color="#${c[1]}" offset="1" />
    </radialGradient>
    <rect width="100%" height="100%" opacity="1" fill="white" />
    <rect width="100%" height="100%" opacity=".5" fill="url(#ab)" />
    <linearGradient id="cdc">
        <stop stop-color="#${c[2]}" offset="0" />
        <stop stop-color="#${c[3]}" offset=".5" />
        <stop stop-color="#${c[2]}" offset="1" />
    </linearGradient>
    <linearGradient id="dcd">
        <stop stop-color="#${c[3]}" offset="0" />
        <stop stop-color="#${c[2]}" offset=".5" />
        <stop stop-color="#${c[3]}" offset="1" />
    </linearGradient>
    <path
        fill="url(#cdc)"
        stroke-width=".1"
        stroke="url(#dcd)"
        d="${p[0]}${p[1]}"
    />
</svg>`;
};
