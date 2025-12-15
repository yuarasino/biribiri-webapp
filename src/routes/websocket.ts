import { HOST_UUID } from "~/consts.ts";
import { define } from "~/utils/typing.ts";

export const handler = define.handlers({
  GET: ({ req }) => {
    const { socket, response } = Deno.upgradeWebSocket(req);

    const channel = new BroadcastChannel(HOST_UUID);

    // ゲストが接続してきたとき
    channel.addEventListener("message", (event) => {
      socket.send(event.data);
    });

    // ホストがボタンを押したとき
    socket.addEventListener("message", (event) => {
      channel.postMessage(event.data);
    });

    socket.addEventListener("close", () => {
      channel.close();
    });

    return response;
  },
});
