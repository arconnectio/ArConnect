import { onMessage } from "webext-bridge";

// watch for API calls
onMessage("api_call", async ({ data }) => {
  // TODO: check if the data.type is a valid api function

  return {
    type: data.type + "_response",
    data: "test",
    callID: data.callID
  };
});

export {};
