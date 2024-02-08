async function getANTsContractTxIds(owner) {
  const response = await fetch(
    `https://api.arns.app/v1/wallet/${owner}/contracts?type=ant`
  );
  const data = await response.json();
  return data.contractTxIds;
}

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
