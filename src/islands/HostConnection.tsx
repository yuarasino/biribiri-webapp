import { useEffect, useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { WebSocketMessage } from "~/types.ts";

export interface HostConnectionProps {
  url: URL;
}

export interface Guest {
  uuid: string;
  name: string;
}

export const HostConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket>();
  const [guests, setGuests] = useState<Guest[]>([]);

  const wsurl = "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);

    // ゲストが接続してきたとき
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "connect") {
        setGuests((prev) => [
          ...prev,
          {
            uuid: message.data.uuid,
            name: message.data.name,
          },
        ]);
      }
    });

    setSocket(socket);

    return () => {
      socket.close();
    };
  }, []);

  const onLaunch = () => {
    if (!socket) {
      throw new Error("サーバーに接続できませんでした。");
    }
    const message: WebSocketMessage = {
      type: "launch",
      data: {
        targets: [guests[0].uuid],
      },
    };
    socket.send(JSON.stringify(message));
  };

  return (
    <div>
      <button type="button" onClick={onLaunch}>接続</button>
      <ul>
        {guests.map((guest) => <li key={guest.uuid}>{guest.name}</li>)}
      </ul>
    </div>
  );
});
