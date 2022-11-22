import {
  CacheKey,
  CacheOptions,
  defaultCacheOptions,
  SortKeyCache,
  SortKeyCacheResult
} from "warp-contracts";
import { nanoid } from "nanoid";

export default class SandboxCache<V = any> implements SortKeyCache<V> {
  constructor(cacheOptions: CacheOptions = defaultCacheOptions) {}

  async get(contractTxId: string, sortKey: string, returnDeepCopy?: boolean) {
    return await this.invokeFunction<SortKeyCacheResult<V> | null>("get", [
      contractTxId,
      sortKey,
      returnDeepCopy
    ]);
  }

  async put(stateCacheKey: CacheKey, value: V) {
    return await this.invokeFunction<void>("put", [stateCacheKey, value]);
  }

  async getLast(contractTxId: string) {
    return await this.invokeFunction<SortKeyCacheResult<V> | null>("getLast", [
      contractTxId
    ]);
  }

  async getLessOrEqual(contractTxId: string, sortKey: string) {
    return await this.invokeFunction<SortKeyCacheResult<V> | null>(
      "getLessOrEqual",
      [contractTxId, sortKey]
    );
  }

  async allContracts() {
    return await this.invokeFunction<string[]>("allContracts");
  }

  async close() {
    return await this.invokeFunction<void>("close");
  }

  async dump(): Promise<any> {
    throw new Error("Not implemented yet");
  }

  async getLastSortKey(): Promise<string | null> {
    throw new Error("Not implemented yet");
  }

  async invokeFunction<T = any>(fn: string, params: any[] = []) {
    // generate an ID for the call
    const callID = nanoid();

    return await new Promise<T>((resolve, reject) => {
      // listen for the result
      const resultListener = (
        e: MessageEvent<{
          callID: string;
          error?: boolean;
          res: T | string;
        }>
      ) => {
        // check message ID
        if (e.data.callID !== callID) return;

        // remove listener
        window.removeEventListener("message", resultListener);

        // handle result
        if (e.data.error) {
          reject(e.data.res as string);
        } else {
          resolve(e.data.res as T);
        }
      };

      // add listener
      window.addEventListener("message", resultListener);

      // send call message
      window.postMessage({
        type: "cache",
        fn,
        callID,
        params
      });
    });
  }

  storage() {
    return undefined;
  }

  prune(): any {}
}
