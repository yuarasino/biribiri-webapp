import { useEffect, useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { Guest, WebSocketMessage } from "~/types.ts";
import { HOST_UUID } from "~/consts.ts";

import type { GenericEventHandler } from "preact";

export type HostConnectionProps = {
  url: URL;
};

export const HostConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(10);
  const [duration, setDuration] = useState<number>(10);

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    setGuests([]);

    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    // ホストが接続したとき
    socket.addEventListener("open", () => {
      const message: WebSocketMessage = {
        type: "connect",
        data: {
          uuid: HOST_UUID,
          name: "host",
        },
      };
      socket.send(JSON.stringify(message));
    });

    // ゲストからメッセージがきたとき
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "connect") {
        if (!guests.find((guest) => guest.uuid === message.data.uuid)) {
          setGuests((prev) =>
            prev.concat({
              uuid: message.data.uuid,
              name: message.data.name,
              timer: 0,
            })
          );
        }
      }
      if (message.type === "disconnect") {
        setGuests((prev) =>
          prev.filter((guest) => guest.uuid !== message.data.uuid)
        );
      }
    });

    globalThis.addEventListener("beforeunload", () => {
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
    });

    setSocket(socket);
  }, []);

  const onGuestChecked: GenericEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    if (target.checked) {
      setTargets((prev) => prev.concat(target.value));
    } else {
      setTargets((prev) => prev.filter((uuid) => uuid !== target.value));
    }
  };

  const onLevelInput: GenericEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    setLevel(Number(target.value));
  };

  const onDurationInput: GenericEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    setDuration(Number(target.value));
  };

  const onLaunchClicked: GenericEventHandler<HTMLButtonElement> = () => {
    if (!socket) {
      return;
    }
    const message: WebSocketMessage = {
      type: "launch",
      data: {
        targets: targets,
        level: level,
        duration: duration,
      },
    };
    socket.send(JSON.stringify(message));
  };

  return (
    <div>
      <div>
        <ul>
          {guests.map((guest) => (
            <li key={guest.uuid}>
              <div>{guest.name}</div>
              <div>{guest.timer}</div>
              <div>
                <input
                  type="checkbox"
                  value={guest.uuid}
                  checked={targets.includes(guest.uuid)}
                  onChange={onGuestChecked}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div>
          <input type="number" value={level} onInput={onLevelInput} />
        </div>
        <div>
          <input type="number" value={duration} onInput={onDurationInput} />
        </div>
        <div>
          <button type="button" onClick={onLaunchClicked}>起動</button>
        </div>
      </div>
    </div>
  );
});
