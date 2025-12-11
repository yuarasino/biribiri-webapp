import { useEffect, useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { WebSocketMessage } from "~/types.ts";

export interface HostConnectionProps {
  url: URL;
}

export const GuestConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [websocket, setWebSocket] = useState<WebSocket>();
  const [uuid, setUuid] = useState<string>("");
  const [name, setName] = useState<string>("");

  const wsurl = "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);
    const uuid = crypto.randomUUID();

    // ホストがボタンを押したとき
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "launch") {
        const targets = message.data.targets;
        if (Array.isArray(targets) && targets.includes(uuid)) {
          console.log("launched");
        }
      }
    });

    setWebSocket(socket);
    setUuid(uuid);

    return () => {
      const message: WebSocketMessage = {
        type: "disconnect",
        data: {
          uuid: uuid,
        },
      };
      socket.send(JSON.stringify(message));
      socket.close();
    };
  }, []);

  const onChange = (event: InputEvent) => {
    const target = event.target as HTMLInputElement;
    setName(target.value);
  };

  const onConnect = () => {
    if (!websocket) {
      throw new Error("サーバーに接続できませんでした。");
    }
    if (!name) {
      throw new Error("名前を入力してください。");
    }

    const message: WebSocketMessage = {
      type: "connect",
      data: {
        uuid: uuid,
        name: name,
      },
    };
    websocket.send(JSON.stringify(message));
  };

  return (
    <div>
      <form>
        <input type="text" value={name} onInput={onChange} />
        <button type="button" onClick={onConnect}>接続</button>
      </form>
    </div>
  );
});
