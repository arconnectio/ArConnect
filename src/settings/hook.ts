import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { getSetting, PREFIX } from "~settings";

const useSetting = <T = any>(name: string) => {
  const setting = getSetting(name);
  const hook = useStorage<T>(
    {
      key: `${PREFIX}${name}`,
      instance: ExtensionStorage
    },
    // @ts-expect-error
    (val) => val || setting.defaultValue
  );

  return hook;
};

export default useSetting;
