const addressRegex = /^[a-z0-9-_]{43}$/i;

type svgieOptions = {
  asDataURI?: boolean;
  dimension?: number;
};

export const svgie = (address: string, opts?: svgieOptions) => {
  if (!address || address.length !== 43 || !addressRegex.test(address)) return;

  const { asDataURI = false, dimension = 32 } = opts;

  if (dimension < 1) return;

  const hexAddress = addressToHex(address);
  const hexPaths = hexAddress.slice(0, 40);
  const hexColors = hexAddress.slice(40);

  const c = getColors(hexColors);
  const p = getSPaths(hexPaths);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${dimension}" height="${dimension}">
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

  if (asDataURI) return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return svg;
};

const addressToHex = (address: string) => {
  // Replace special characters and restore padding
  const base64 = address.replace(/-/g, "+").replace(/_/g, "/") + "==";
  // Convert Base64 to binary data
  const binaryData = Buffer.from(base64, "base64");
  // Convert binary data to hex
  const hexString = binaryData.toString("hex");
  return hexString;
};

const fixOpacity = (hexString) => {
  const data =
    hexString.length == 8
      ? hexString
      : hexString.length == 6
      ? hexString + "ff"
      : "ffffffff";
  return (
    data?.slice(0, 6) +
    parseInt(
      `${(parseInt(data?.slice(6, 8), 16) * 256) / 1024 + 191}`
    ).toString(16)
  );
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

// repeat every char in the string twice
const repeatChar = (s) => {
  return s
    .split("")
    .map((c) => c.repeat(2))
    .join("");
};

// if color is 8 characters, split in half and use webcolors
const splitColor = (s) => {
  if (s.length == 8) return [repeatChar(s.slice(0, 4)), repeatChar(s.slice(4))];
  return [s, s];
};

// Split hex data into groups of 4 bytes to create rgba colors
const getColors = (hexData) => {
  let colors = hexData?.match(/.{1,8}/g) || [];
  switch (colors.length) {
    case 1:
      return [];
    case 2:
      colors = [...splitColor(colors[0]), ...splitColor(colors[1])];
      break;
    case 3:
      colors = [...splitColor(colors[0]), ...colors.slice(1)];
      break;
    default:
      break;
  }
  return colors.map((hex) => fixOpacity(hex));
};

const getSPaths = (ethAddress) => {
  const arr = ethAddress?.split("").map((char) => parseInt(char, 16) + 8);
  let symArr = arr?.map((val, index) => (index % 2 ? val : 32 - val));
  return [getSPath(arr), getSPath(symArr)];
};
