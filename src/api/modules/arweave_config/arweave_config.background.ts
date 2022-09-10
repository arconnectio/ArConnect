import type { ModuleFunction } from "~api/background";
import type { Gateway } from "~applications/gateway";
import { getActiveAppURL } from "~applications";
import Application from "~applications/application";

const background: ModuleFunction<Gateway> = async () => {
  const app = new Application(await getActiveAppURL());
  const gateway = await app.getGatewayConfig();

  return gateway;
};

export default background;
