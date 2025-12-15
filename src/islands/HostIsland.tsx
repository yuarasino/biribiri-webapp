import { useEffect, useRef, useState } from "preact/hooks";
import { HOST_NAME, HOST_UUID } from "~/consts.ts";
import { GuestWithIsSelected, WebSocketMessage } from "~/types.ts";
import { defineComponent } from "~/utils/typing.ts";

export type HostIslandProps = {
  url: URL;
};

export const HostIsland = defineComponent<HostIslandProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket | undefined>(undefined);
  const [guests, setGuests] = useState<GuestWithIsSelected[]>([]);
  const guestsRef = useRef<GuestWithIsSelected[]>(guests);
  guestsRef.current = guests;

  const [level, setLevel] = useState<number>(10);
  const [duration, setDuration] = useState<number>(10);

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }
    setSocket(socket);

    socket.addEventListener("open", () => {
      const message = {
        type: "connect",
        data: {
          uuid: HOST_UUID,
          name: HOST_NAME,
        },
      };
      socket.send(JSON.stringify(message));
    });

    socket.addEventListener("message", (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === "connect") {
        if (message.data.uuid !== HOST_UUID) {
          if (
            !guestsRef.current.some((guest) => guest.uuid === message.data.uuid)
          ) {
            const guest: GuestWithIsSelected = {
              uuid: message.data.uuid,
              name: message.data.name,
              timer: -1,
              isRunning: false,
              isSelected: false,
            };
            setGuests(guestsRef.current.concat(guest));
          }
        }
      }
      if (message.type === "disconnect") {
        setGuests(
          guestsRef.current.filter((guest) => guest.uuid !== message.data.uuid),
        );
      }
    });

    const onWindowClose = () => {
      socket.close();
    };

    globalThis.addEventListener("beforeunload", onWindowClose);

    return () => {
      globalThis.removeEventListener("beforeunload", onWindowClose);
    };
  }, []);

  const onNameInput = (event: Event, uuid: string) => {
    if (!socket) {
      return;
    }
    const target = event.target as HTMLInputElement;
    const name = target.value;

    setGuests(guests.map((guest) => {
      if (guest.uuid === uuid) {
        return {
          ...guest,
          name: name,
        };
      }
      return guest;
    }));

    const data: WebSocketMessage = {
      type: "name",
      data: {
        uuid: uuid,
        name: name,
      },
    };
    socket.send(JSON.stringify(data));
  };

  const onLevelInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const level = Number(target.value);
    setLevel(level);
  };

  const onDurationInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const duration = Number(target.value);
    setDuration(duration);
  };

  const onLaunchClick = () => {
    if (!socket) {
      return;
    }

    const data: WebSocketMessage = {
      type: "launch",
      data: {
        targets: guests.filter((guest) => guest.isSelected).map((guest) =>
          guest.uuid
        ),
        level: level,
        duration: duration,
      },
    };
    socket.send(JSON.stringify(data));
  };

  return (
    <div>
      <ul>
        {guests.map((guest) => (
          <li key={guest.uuid}>
            <input
              type="text"
              value={guest.name}
              onInput={(event) => onNameInput(event, guest.uuid)}
            />
          </li>
        ))}
      </ul>
      <div>
        <button type="button" onClick={onLaunchClick}>
          起動
        </button>
        <input type="number" value={level} onInput={onLevelInput} />
        <input type="number" value={duration} onInput={onDurationInput} />
      </div>
    </div>
  );
});
