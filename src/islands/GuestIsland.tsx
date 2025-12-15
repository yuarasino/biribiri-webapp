import { useEffect, useRef, useState } from "preact/hooks";
import { HOST_UUID, VENDOR_ID } from "~/consts.ts";
import {
  GuestWithPort,
  NavigatorWithSerial,
  SerialPort,
  WebSocketMessage,
} from "~/types.ts";
import { defineComponent } from "~/utils/typing.ts";

export type GuestIslandProps = {
  url: URL;
};

export const GuestIsland = defineComponent<GuestIslandProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket | undefined>(undefined);
  const [guests, setGuests] = useState<GuestWithPort[]>([]);
  const guestsRef = useRef<GuestWithPort[]>(guests);
  guestsRef.current = guests;

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

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      if (message.type === "connect") {
        if (message.data.uuid === HOST_UUID) {
          for (const guest of guestsRef.current) {
            const data: WebSocketMessage = {
              type: "connect",
              data: {
                uuid: guest.uuid,
                name: guest.name,
              },
            };
            socket.send(JSON.stringify(data));
          }
        }
      }
      if (message.type === "name") {
        setGuests(guestsRef.current.map((guest) => {
          if (guest.uuid === message.data.uuid) {
            return {
              ...guest,
              name: message.data.name,
            };
          }
          return guest;
        }));
      }
      if (message.type === "launch") {
        for (const guest of guestsRef.current) {
          if (message.data.targets.includes(guest.uuid)) {
            const writer = guest.port.writable.getWriter();
            const encoder = new TextEncoder();
            const parameter = (message.data.level << 8) | message.data.duration;
            const data = "-> " + String(parameter);
            const chunk = encoder.encode(data);
            writer.write(chunk);
            writer.releaseLock();
          }
        }
      }
    });

    const onWindowClose = async () => {
      for (const guest of guestsRef.current) {
        const data: WebSocketMessage = {
          type: "disconnect",
          data: {
            uuid: guest.uuid,
          },
        };
        socket.send(JSON.stringify(data));
        await guest.port.close();
      }
      socket.close();
    };

    globalThis.addEventListener("beforeunload", onWindowClose);

    return () => {
      globalThis.removeEventListener("beforeunload", onWindowClose);
    };
  }, []);

  const onSerialClick = async () => {
    if (!socket) {
      return;
    }
    let port: SerialPort | undefined = undefined;
    try {
      port = await (navigator as NavigatorWithSerial).serial.requestPort({
        filters: [{ usbVendorId: VENDOR_ID }],
      });
    } catch (error) {
      alert(
        "USBポートに電流デバイスが接続されていることを確認して、再試行してください。",
      );
      console.error(error);
      return;
    }
    await port.open({ baudRate: 9600 });

    const uuid = crypto.randomUUID();
    const guest: GuestWithPort = {
      uuid: uuid,
      name: uuid.slice(0, 8),
      timer: -1,
      isRunning: false,
      port: port,
    };
    setGuests(guestsRef.current.concat(guest));

    const data: WebSocketMessage = {
      type: "connect",
      data: {
        uuid: guest.uuid,
        name: guest.name,
      },
    };
    socket.send(JSON.stringify(data));
  };

  return (
    <div>
      <button type="button" onClick={onSerialClick}>
        接続
      </button>
      <ul>
        {guests.map((guest) => (
          <li key={guest.uuid}>
            <div>{guest.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
});
