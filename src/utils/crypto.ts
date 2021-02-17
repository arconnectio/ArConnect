// Encrypt/Decrypt functions using AES in GCM mode.

export interface EncryptionResult {
  data: ArrayBuffer;
  iv: Uint8Array;
  key: ArrayBuffer;
}

class Crypto {
  secret: string;
  constructor(secret: string) {
    this.secret = secret;
  }

  async genKey(salt: Uint8Array): Promise<ArrayBuffer> {
    var encoder = new TextEncoder();
    var passphraseKey = encoder.encode();
    let key = await crypto.subtle.importKey(
      "raw",
      passphraseKey,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    let webkey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 1000, hash: "SHA-256" },
      key,

      // Note: for this demo we don't actually need a cipher suite,
      // but the api requires that it must be specified.
      // For AES the length required to be 128 or 256 bits (not bytes)
      { name: "AES-CBC", length: 256 },
      true,

      // this web crypto object will only be allowed for these functions
      ["encrypt", "decrypt"]
    );

    return await crypto.subtle.exportKey("raw", webkey);
  }

  async encrypt(data: Uint8Array | string): Promise<EncryptionResult> {
    if (typeof data == "string") {
      data = new TextEncoder().encode(data);
    }
    var saltBuffer = crypto.getRandomValues(new Uint8Array(8));
    let iv = window.crypto.getRandomValues(new Uint8Array(12));

    const pkkey = await this.genKey(saltBuffer);

    let encoded_key = await crypto.subtle.importKey(
      "raw",
      pkkey,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
    let key = await crypto.subtle.exportKey("raw", encoded_key);
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
      iv,
      key
    };
  }

  async decrypt(encrypted: EncryptionResult): Promise<ArrayBuffer> {
    const { iv, data, key } = encrypted;
    let imported_key = await crypto.subtle.importKey(
      "raw",
      key,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
    return window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      imported_key,
      data
    );
  }

  async decryptString(encrypted: EncryptionResult): Promise<string> {
    let decryptedBuff = await this.decrypt(encrypted);

    return new TextDecoder().decode(decryptedBuff);
  }
}

export default Crypto;
