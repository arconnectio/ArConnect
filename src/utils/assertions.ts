import { SignatureOptions } from "arweave/node/lib/crypto/crypto-interface";
import { PermissionType, permissionData } from "~applications/permissions";
import type { SignMessageOptions } from "~api/modules/sign_message/types";
import { SplitTransaction } from "~api/modules/sign/transaction_builder";
import Transaction from "arweave/web/lib/transaction";
import { DecodedTag } from "~api/modules/sign/tags";
import { AppInfo } from "~applications/application";
import { Chunk } from "~api/modules/sign/chunks";
import { Gateway } from "~applications/gateway";
import { isAddressFormat } from "./format";
import { TokenType } from "~tokens/token";
import {
  EncryptionAlgorithm,
  LegacyEncryptionOptions
} from "~api/modules/encrypt/types";
import { ApiCall } from "shim";
import {
  assert,
  isNumber,
  isOneOf,
  isRecordWithKeys,
  isString,
  isArrayOfType,
  isArray,
  isRecord,
  isInstanceOf,
  isOneOfType,
  isNotUndefined,
  isNotNull
} from "typed-assert";

export function isGateway(input: unknown): asserts input is Gateway {
  isRecordWithKeys(
    input,
    ["host", "port", "protocol"],
    "A gateway object should only have the following keys: host, port, protocol."
  );
  isString(input.host, "Gateway host should be a string.");
  isNumber(input.port, "Gateway port should be a number.");
  isOneOf(
    input.protocol,
    ["http", "https"],
    "Gateway protocol should be https/http."
  );
}

export function isTokenType(input: unknown): asserts input is TokenType {
  isString(input, "Token type should be a string.");
  isOneOf(
    input,
    ["asset", "collectible"],
    "Token type should be asset/collectible."
  );
}

export function isAddress(input: unknown): asserts input is string {
  isString(input, "Address or ID should be a string.");
  assert(isAddressFormat(input), "Invalid address or ID format.");
}

export function isPermissionsArray(
  input: unknown
): asserts input is PermissionType[] {
  isArray(input, "Input has to be an array of permissions.");
  isArrayOfType(input, isPermission, "Permission array has an invalid member.");
}

export function isPermission(input: unknown): asserts input is PermissionType {
  isString(input, "Permission has to be a string.");
  isOneOf(
    input,
    Object.keys(permissionData),
    "Input is not a valid permission."
  );
}

export function isAppInfo(input: unknown): asserts input is AppInfo {
  isRecord(input, "App info has to be a Record<string, any>.");

  const allowedFields = ["name", "logo"];

  for (const key in input) {
    isOneOf(key, allowedFields, `"${key}" is not a valid field for AppInfo.`);
  }
}

export function isSplitTransaction(
  input: unknown
): asserts input is SplitTransaction {
  const stringKeys = [
    "id",
    "last_tx",
    "owner",
    "target",
    "quantity",
    "data_size",
    "data_root",
    "reward",
    "signature"
  ];

  isRecordWithKeys(
    input,
    [...stringKeys, "format", "chunks"],
    "A key is missing from the raw transaction object."
  );

  for (const key of stringKeys) {
    isString(input[key], `"${key}" of transaction has to be a string.`);
  }

  isNumber(input.format, '"format" of transaction has to be a number.');
  isRecordWithKeys(
    input.chunks,
    ["data_root", "chunks", "proofs"],
    "Invalid transaction chunk format."
  );
}

export function isRawTransaction(input: unknown): asserts input is Transaction {
  isSplitTransaction(input);
  isInstanceOf(
    input.data,
    Uint8Array,
    "Transaction data has to be Uint8Array."
  );
  isArrayOfType(input.tags, isTag, "Invalid tags array.");
}

export function isTag(input: unknown): asserts input is DecodedTag {
  isRecordWithKeys(input, ["name", "value"], "Invalid keys in tag.");
  isString(input.name, "Tag name has to be a string");
  isString(input.value, "Tag value has to be a string.");
}

export function isSignatureOptions(
  input: unknown
): asserts input is SignatureOptions {
  isRecord(input, "Signature options has to be a record.");

  if (typeof input.saltLength !== "undefined") {
    isNumber(input.saltLength, "Salt length has to be a number.");
  }
}

export function isChunk(input: unknown): asserts input is Chunk {
  isRecord(input, "Chunk has to be a record.");
  isString(input.collectionID, "Chunk collection ID has to be a string.");
  isOneOf(input.type, ["tag", "data", "start", "end"], "Invalid chunk type.");
  isNumber(input.index, "Chunk index has to be a number.");

  if (input.value) {
    isOneOfType(
      input.value,
      [isNumberArray, isTag],
      "Chunk value has to be a tag or a raw typed array."
    );
  }
}

export function isNumberArray(input: unknown): asserts input is number[] {
  isArrayOfType(input, isNumber, "Array can only contain numbers.");
}

export function isApiCall(
  input: unknown
): asserts input is ApiCall<{ params: any[] }> {
  isRecord(input, "Api call has to be a record.");
  isString(input.callID, "Call ID has to be a string.");
  isString(input.type, "Message type has to be a string.");
}

export function isEncryptionAlgorithm(
  input: unknown
): asserts input is EncryptionAlgorithm {
  isNotUndefined(input, "Algorithm cannot be undefined.");
  isNotNull(input, "Algorithm cannot be null.");

  if (typeof input === "string") return;

  isRecord(input, "Algorithm needs to be a string on a record.");
  isString(input.name, "Algorithm name needs to be a string.");
}

export function isLegacyEncryptionOptions(
  input: unknown
): asserts input is LegacyEncryptionOptions {
  isNotUndefined(input, "Encryption options have to be defined.");
  isRecord(input, "Encryption options have to be a record.");
  isString(input.algorithm, "Encryption algorithm has to be a string.");
  isString(input.hash, "Encryption hash has to be a string.");

  if (input.salt) isString(input.salt, "Encryption salt has to be a string.");
}

export function isSignMessageOptions(
  input: unknown
): asserts input is SignMessageOptions {
  isRecordWithKeys(
    input,
    ["hashAlgorithm"],
    "Sign message options has to be a record."
  );
  isOneOf(
    input.hashAlgorithm,
    ["SHA-256", "SHA-384", "SHA-512"],
    "Invalid hash algorithm."
  );
}

export function isArrayBuffer(input: unknown): asserts input is ArrayBuffer {
  isNotUndefined("Data has to be defined.");
  assert(ArrayBuffer.isView(input), "Input is not an ArrayBuffer.");
}
