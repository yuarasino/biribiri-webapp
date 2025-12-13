import { useEffect, useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { WebSocketMessage } from "~/types.ts";
import { HOST_UUID, VENDOR_ID } from "../consts.ts";

export interface HostConnectionProps {
  url: URL;
}

export const GuestConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket>();
  const [uuid, setUuid] = useState<string>("");
  const [name, setName] = useState<string>("");

  // deno-lint-ignore no-explicit-any
  const [port, setPort] = useState<any>();
  const [writer, setWriter] = useState<WritableStreamDefaultWriter<string>>();
  const [closed, setClosed] = useState<Promise<void>>();

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    const uuid = crypto.randomUUID();

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      processMessage(message);
    });

    setSocket(socket);
    setUuid(uuid);

    globalThis.addEventListener("beforeunload", () => {
      disconnectSerial();
      disconnectSocket();
    });
  }, []);

  const processMessage = (message: WebSocketMessage) => {
    if (!socket) {
      return;
    }
    if (message.type === "connect") {
      if (message.data.uuid === HOST_UUID) {
        const message: WebSocketMessage = {
          type: "connect",
          data: {
            uuid: uuid,
            name: name,
          },
        };
        socket.send(JSON.stringify(message));
      }
    }
    if (message.type === "launch") {
      if (message.data.targets.includes(uuid)) {
        sendSerial(message.data.level, message.data.duration);
      }
    }
  };

  const connectSocket = () => {
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    const message: WebSocketMessage = {
      type: "connect",
      data: {
        uuid: uuid,
        name: name,
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
        uuid: uuid,
      },
    };
    socket.send(JSON.stringify(message));
    socket.close();
  };

  const connectSerial = async () => {
    // deno-lint-ignore no-explicit-any
    const port = await (navigator as any).serial.requestPort({
      filters: [{ usbVendorId: VENDOR_ID }],
    });
    await port.open({ baudRate: 115200 });
    const encoder = new TextEncoderStream();
    const writer = encoder.writable.getWriter();
    const closed = encoder.readable.pipeTo(port.writable);
    setPort(port);
    setWriter(writer);
    setClosed(closed);
  };

  const disconnectSerial = async () => {
    if (!port || !writer || !closed) {
      return;
    }
    writer.releaseLock();
    writer.close();
    await closed;
    await port.close();
    setPort(undefined);
    setWriter(undefined);
    setClosed(undefined);
  };

  const sendSerial = (level: number, duration: number) => {
    if (!writer) {
      return;
    }
    const parameter = (level << 8) | duration;
    const message = "-> " + String(parameter);
    writer.write(message);
    console.info(message);
  };

  const onInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement;
    setName(target.value);
  };

  const onConnect = async () => {
    if (!name) {
      alert("名前を入力してください");
      return;
    }

    try {
      await connectSerial();
    } catch {
      alert(
        "ビリビリ装置に接続できませんでした。ページを再読み込みしてください。",
      );
      return;
    }

    connectSocket();
  };

  return (
    <div>
      <form>
        <input type="text" value={name} onInput={onInput} />
        <button type="button" onClick={onConnect}>接続</button>
      </form>
    </div>
  );
});
