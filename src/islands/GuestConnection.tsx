import { useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { NavigatorWithSerial, SerialPort, WebSocketMessage } from "~/types.ts";
import { HOST_UUID, VENDOR_ID } from "../consts.ts";

export type HostConnectionProps = {
  url: URL;
};

export const GuestConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [_socket, setSocket] = useState<WebSocket>();
  const [_uuid, setUuid] = useState<string>("");
  const [name, setName] = useState<string>("");

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  const onNameInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement;
    setName(target.value);
  };

  const onConnectClicked = async () => {
    if (!name) {
      alert("名前を入力してください");
      return;
    }

    const uuid = crypto.randomUUID();

    let port: SerialPort | undefined = undefined;
    try {
      port = await (navigator as NavigatorWithSerial).serial.requestPort({
        filters: [{ usbVendorId: VENDOR_ID }],
      });
    } catch {
      alert(
        "ビリビリ装置に接続できませんでした。ページを再読み込みしてください。",
      );
      return;
    }
    await port.open({ baudRate: 115200 });
    const encoder = new TextEncoderStream();
    const writer = encoder.writable.getWriter();
    const closed = encoder.readable.pipeTo(port.writable);

    const sendSerial = (level: number, duration: number) => {
      const parameter = (level << 8) | duration;
      const message = "-> " + String(parameter);
      writer.write(message);
      console.info(message);
    };

    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }

    // ゲストが接続したとき
    socket.addEventListener("open", () => {
      const message: WebSocketMessage = {
        type: "connect",
        data: {
          uuid: uuid,
          name: name,
        },
      };
      socket.send(JSON.stringify(message));
    });

    // ホストからメッセージがきたとき
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "connect") {
        if (message.data.uuid === HOST_UUID) {
          if (uuid) {
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
      }
      if (message.type === "launch") {
        console.info("state", uuid, name);
        console.info("data", message.data);
        if (message.data.targets.includes(uuid)) {
          console.info("send");
          sendSerial(message.data.level, message.data.duration);
        }
      }
    });

    globalThis.addEventListener("beforeunload", async () => {
      writer.releaseLock();
      writer.close();
      await closed;
      await port.close();

      const message: WebSocketMessage = {
        type: "disconnect",
        data: {
          uuid: uuid,
        },
      };
      socket.send(JSON.stringify(message));
      socket.close();
    });

    setSocket(socket);
    setUuid(uuid);
  };

  return (
    <div>
      <form>
        <input type="text" value={name} onInput={onNameInput} />
        <button type="button" onClick={onConnectClicked}>接続</button>
      </form>
    </div>
  );
});
