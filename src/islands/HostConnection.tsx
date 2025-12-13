import { useEffect, useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { WebSocketMessage } from "~/types.ts";
import { HOST_UUID } from "~/consts.ts";

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

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    // ゲストが接続してきたとき
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      processMessage(message);
    });

    socket.addEventListener("open", () => {
      connectSocket();
    });

    setSocket(socket);
    setGuests([]);

    globalThis.addEventListener("beforeunload", () => {
      disconnectSocket();
    });
  }, []);

  const processMessage = (message: WebSocketMessage) => {
    if (!socket) {
      return;
    }
    if (message.type === "connect") {
      if (!guests.find((guest) => guest.uuid === message.data.uuid)) {
        setGuests(guests.concat({
          uuid: message.data.uuid,
          name: message.data.name,
        }));
      }
    }
    if (message.type === "disconnect") {
      setGuests(guests.filter((guest) => guest.uuid !== message.data.uuid));
    }
  };

  const onLaunch = () => {
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    const message: WebSocketMessage = {
      type: "launch",
      data: {
        targets: [guests[0].uuid],
        level: 10,
        duration: 10,
      },
    };
    socket.send(JSON.stringify(message));
  };

  const connectSocket = () => {
    if (!socket) {
      return;
    }
    const message: WebSocketMessage = {
      type: "connect",
      data: {
        uuid: HOST_UUID,
        name: "host",
      },
    };
    socket.send(JSON.stringify(message));
  };

  const disconnectSocket = () => {
    if (!socket) {
      return;
    }
    const message: WebSocketMessage = {
      type: "disconnect",
      data: {
        uuid: HOST_UUID,
      },
    };
    socket.send(JSON.stringify(message));
    socket.close();
  };

  return (
    <div>
      <button type="button" onClick={onLaunch}>起動</button>
      <ul>
        {guests.map((guest) => <li key={guest.uuid}>{guest.name}</li>)}
      </ul>
    </div>
  );
});
