import type { ModuleFunction } from "~api/background";
import type { Gateway } from "~applications/gateway";
import Application from "~applications/application";

const background: ModuleFunction<Gateway> = async (appData) => {
  const app = new Application(appData.appURL);
  const gateway = await app.getGatewayConfig();

  return gateway;
};

export default background;
