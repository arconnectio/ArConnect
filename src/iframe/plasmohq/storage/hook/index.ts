import { useStorage as plasmoUseStorage } from "@plasmohq/storage/hook";
import { useCallback, useState } from "react";

type UseStorageType = typeof plasmoUseStorage;

// TODO: For the initial version, use localStorage or sessionStorage (that's for the "@plasmohq/storage" (Storage) polyfill)
// TODO: After that, consider whether some values must be persisted on the backend instead.

type Setter<T> = ((v?: T, isHydrated?: boolean) => T) | T;
/**
 * isPublic: If true, the value will be synced with web API Storage
 */
type RawKey =
  | string
  | {
      key: string;
      // instance: BaseStorage;
      instance: any;
    };

export function useStorage<T = any>(
  rawKey: RawKey,
  onInit: Setter<T>
): [
  T,
  (setter: Setter<T>) => Promise<void>,
  {
    readonly setRenderValue: React.Dispatch<React.SetStateAction<T>>;
    readonly setStoreValue: (v: T) => Promise<null>;
    readonly remove: () => void;
  }
];
export function useStorage<T = any>(
  rawKey: RawKey
): [
  T | undefined,
  (setter: Setter<T>) => Promise<void>,
  {
    readonly setRenderValue: React.Dispatch<
      React.SetStateAction<T | undefined>
    >;
    readonly setStoreValue: (v?: T) => Promise<null>;
    readonly remove: () => void;
  }
];
export function useStorage<T = any>(
  rawKey: RawKey,
  onInit?: Setter<T>
): ReturnType<UseStorageType> {
  console.log("My useStorage()");

  const initialStoredValue =
    typeof onInit === "function" ? onInit() : undefined;
  const initialRenderValue =
    typeof onInit === "function" ? initialStoredValue : onInit;

  const [renderValue, setRenderValue] = useState(initialRenderValue);

  const setState = useCallback(
    async (setter: Setter<T>) => {
      setRenderValue(typeof setter === "function" ? setter() : setter);
    },
    [setRenderValue]
  );

  const setStoreValue = useCallback(
    async (v?: T) => {
      setRenderValue(v);

      return null;
    },
    [setRenderValue]
  );

  const remove = useCallback(() => {
    setRenderValue(undefined);
  }, [setRenderValue]);

  return [
    renderValue,
    setState,
    {
      setRenderValue,
      setStoreValue,
      remove
    }
  ];
}
