import { onMessage } from "webext-bridge";
import authenticate from "~api/modules/connect/auth";

// watch for API calls
onMessage("api_call", async ({ data, ...rest }) => {
  console.log(rest);
  // TODO: check if the data.type is a valid api function

  try {
    await authenticate({
      type: "unlock"
    });
  } catch (e) {
    console.log(e);
  }

  return {
    type: data.type + "_response",
    data: "test",
    callID: data.callID
  };
});

export {};
