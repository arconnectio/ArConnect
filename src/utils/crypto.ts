// Encrypt/Decrypt functions using AES in GCM mode.

export interface EncryptionResult {
  data: ArrayBuffer;
  iv: Uint8Array;
}

export async function encrypt(
  data: string | Uint8Array,
  key: Uint8Array
): Promise<EncryptionResult> {
  if (typeof data == "string") {
    const encoder = new TextEncoder();
    data = encoder.encode(data);
  }

  let encoded_key = await crypto.subtle.importKey(
    "raw",
    key.buffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
  let iv = window.crypto.getRandomValues(new Uint8Array(12));
  let result = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    encoded_key,
    data
  );

  return {
    data: result,
    iv
  };
}

export async function decrypt(
  encrypted: EncryptionResult,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const { iv, data } = encrypted;
  return window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    data
  );
}
