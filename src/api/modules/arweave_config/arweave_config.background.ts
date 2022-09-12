import type { ModuleFunction } from "~api/background";
import type { Gateway } from "~applications/gateway";
import { getAppURL } from "~applications";
import Application from "~applications/application";

const background: ModuleFunction<Gateway> = async (tab) => {
  const app = new Application(getAppURL(tab.url));
  const gateway = await app.getGatewayConfig();

  return gateway;
};

export default background;
