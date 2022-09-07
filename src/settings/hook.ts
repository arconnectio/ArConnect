import { useStorage } from "@plasmohq/storage"
import { PREFIX } from "~settings";

const useSetting = (name: string) => useStorage({
  key: `${PREFIX}${name}`,
  area: "local"
});

export default useSetting;