import { useStorage } from "@plasmohq/storage";
import { getSetting, PREFIX } from "~settings";

const useSetting = <T = any>(name: string) => {
  const setting = getSetting(name);
  const hook = useStorage<T>({
    key: `${PREFIX}${name}`,
    area: "local"
  // @ts-expect-error
  }, (val) => val || setting.defaultValue);

  return hook;
};

export default useSetting;
