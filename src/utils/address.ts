export function formatAddress(address: string) {
  return (
    address.substring(0, 13) +
    "..." +
    address.substring(address.length - 13, address.length)
  );
}
