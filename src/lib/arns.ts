async function getANTsContractTxIds(owner) {
  const response = await fetch(
    `https://api.arns.app/v1/wallet/${owner}/contracts?type=ant`
  );
  const data = await response.json();
  return data.contractTxIds;
}
const REGISTRY = "bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U";

export async function getAllArNSNames(owner) {
  const contractTxIds = await getANTsContractTxIds(owner);
  if (contractTxIds.length === 0) return [];

  const url = [
    "https://api.arns.app/v1/contract/bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U/records?",
    ...contractTxIds.map((txId) => `contractTxId=${txId}`)
  ].join("&");

  const response = await fetch(url);
  const data = await response.json();
  return data;
}

export async function searchArNSName(name: string) {
  name = name.toLowerCase();
  const response = await fetch(
    `https://api.arns.app/v1/contract/${REGISTRY}/records/${name}`
  );
  if (response.status === 404) {
    return {
      success: true,
      record: null,
      message: `${name} is not registered`
    };
  }
  return {
    success: false,
    record: await response.json(),
    message: `${name} is already registered`
  };
}
