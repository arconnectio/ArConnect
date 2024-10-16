import type {
  Storage as PlasmoStorage,
  StorageCallbackMap
} from "@plasmohq/storage";

export class Storage implements PlasmoStorage {
  #private: any;

  constructor() {}

  get area(): "local" | "sync" | "managed" | "session" {
    throw new Error("Method not implemented.");
  }

  protected rawGet: (key: string) => Promise<string | null | undefined>;

  get: <T = string>(key: string) => Promise<T | undefined>;
  getItem<T = string>(key: string): Promise<T | undefined> {
    throw new Error("Method not implemented.");
  }

  rawGetAll: () => Promise<{ [key: string]: any }>;
  getAll: () => Promise<Record<string, string>>;

  protected parseValue: (rawValue: any) => Promise<any>;

  protected rawSet: (key: string, value: string) => Promise<null>;

  set: (key: string, rawValue: any) => Promise<null>;
  setItem(key: string, rawValue: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

  protected rawRemove: (key: string) => Promise<void>;

  remove: (key: string) => Promise<void>;
  removeItem(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  removeAll: () => Promise<void>;

  clear: (includeCopies?: boolean) => Promise<void>;

  // Not implemented:

  get primaryClient(): chrome.storage.StorageArea {
    throw new Error("Method not implemented.");
  }

  get secondaryClient(): globalThis.Storage {
    throw new Error("Method not implemented.");
  }

  get hasWebApi(): boolean {
    throw new Error("Method not implemented.");
  }

  // Copy:

  get copiedKeySet(): Set<string> {
    throw new Error("Method not implemented.");
  }

  setCopiedKeySet(keyList: string[]): void {
    throw new Error("Method not implemented.");
  }

  isCopied: (key: string) => boolean;

  copy: (key?: string) => Promise<boolean>;

  get allCopied(): boolean {
    throw new Error("Method not implemented.");
  }

  // Extension API:

  getExtStorageApi: () => any;

  get hasExtensionApi(): boolean {
    throw new Error("Method not implemented.");
  }

  // Namespace:

  protected keyNamespace: string;

  isValidKey: (nsKey: string) => boolean;
  getNamespacedKey: (key: string) => string;
  getUnnamespacedKey: (nsKey: string) => string;
  setNamespace: (namespace: string) => void;

  // Watch:
  isWatchSupported: () => boolean;
  watch: (callbackMap: StorageCallbackMap) => boolean;
  unwatch: (callbackMap: StorageCallbackMap) => boolean;
  unwatchAll: () => void;
}
