import type { ModuleFunction } from "~api/background";
import Application from "~applications/application";
import { Gateway } from "~gateways/gateway";

const background: ModuleFunction<Gateway> = async (appData) => {
  const app = new Application(appData.appURL);
  const gateway = await app.getGatewayConfig();

  return gateway;
};

export default background;
