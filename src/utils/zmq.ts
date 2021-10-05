import * as zmq from "zeromq";

const requester: zmq.Socket = zmq.socket("req"); // Uncaught ReferenceError: __dirname is not defined

//requester.on("message", (reply: any) => {
//  console.log("Received reply: ", reply.toString());
//});

//requester.connect("tcp://localhost:5555");

export function sendNativeMessage(action: string, message?: string): void {
  //if (requester) requester.send([action, message]);
}
