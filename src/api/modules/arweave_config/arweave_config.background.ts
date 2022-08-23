import { IGatewayConfig } from "../../../stores/reducers/arweave";
import { getArweaveConfig } from "../../../utils/background";
import { ModuleFunction } from "../../background";

const background: ModuleFunction<IGatewayConfig> = async () => {
  const config = await getArweaveConfig();

  return config;
};

export default background;
