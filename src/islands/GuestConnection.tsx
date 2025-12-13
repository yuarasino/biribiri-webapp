import { useState } from "preact/hooks";
import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import {
  Guest,
  NavigatorWithSerial,
  SerialPort,
  WebSocketMessage,
} from "~/types.ts";
import { HOST_UUID, LEVEL_DELAY, POWER_DELAY, VENDOR_ID } from "../consts.ts";

export type HostConnectionProps = {
  url: URL;
};

export const GuestConnection = defineComponent<HostConnectionProps>((
  { url },
) => {
  const [_socket, setSocket] = useState<WebSocket>();
  const [guest, setGuest] = useState<Guest>({
    uuid: "",
    name: "",
    timer: -1,
    isRunning: false,
  });

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  const onNameInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement;
    setGuest((prev) => ({
      ...prev,
      name: target.value,
    }));
  };

  const loop = async (level: number, duration: number) => {
    const sleep = (t: number) =>
      new Promise((resolve) => setTimeout(resolve, t));
    setGuest((prev) => ({
      ...prev,
      timer: duration,
    }));
    await sleep(POWER_DELAY + LEVEL_DELAY * level);
    for (let i = 0; i < duration; i++) {
      setGuest((prev) => ({
        ...prev,
        timer: prev.timer - 1,
        isRunning: true,
      }));
      await sleep(1000);
    }
    setGuest((prev) => ({
      ...prev,
      timer: -1,
      isRunning: false,
    }));
  };

  const onConnectClicked = async () => {
    if (!guest.name) {
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
          name: guest.name,
        },
      };
      socket.send(JSON.stringify(message));
    });

    // ホストからメッセージがきたとき
    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "connect") {
        if (message.data.uuid === HOST_UUID) {
          if (uuid) {
            const message: WebSocketMessage = {
              type: "connect",
              data: {
                uuid: uuid,
                name: guest.name,
              },
            };
            socket.send(JSON.stringify(message));
          }
        }
      }
      if (message.type === "launch") {
        if (message.data.targets.includes(uuid)) {
          sendSerial(message.data.level, message.data.duration);
          await loop(message.data.level, message.data.duration);
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
    setGuest((prev) => ({
      ...prev,
      uuid: uuid,
    }));
  };

  return (
    <div class={cn("p-8 max-w-lg mx-auto")}>
      {guest.uuid && (
        <div class={cn("mb-12 flex flex-col items-center")}>
          <h2 class={cn("text-2xl font-bold mb-6 text-gray-800")}>
            あなたの状態
          </h2>
          <div
            class={cn(
              "w-[200px] h-[200px] rounded-xl border-2 flex flex-col items-center justify-between p-5 transition-all duration-200 shadow-sm",
              guest.timer >= 0
                ? "border-red-500 bg-red-50 shadow-red-100"
                : "border-gray-200 bg-white",
              guest.isRunning ? "animate-shake" : "",
            )}
          >
            <div class={cn("text-center w-full")}>
              <div
                class={cn(
                  "font-bold text-gray-800 text-lg mb-1 truncate px-1",
                )}
                title={guest.name}
              >
                {guest.name}
              </div>
            </div>

            <div class={cn("text-4xl font-mono font-bold text-gray-700 my-2")}>
              {guest.timer >= 0
                ? (
                  <>
                    {guest.timer}
                    <span class={cn("text-sm ml-1 text-gray-400 font-normal")}>
                      s
                    </span>
                  </>
                )
                : <span class={cn("text-2xl")}>休電中</span>}
            </div>

            <div
              class={cn(
                "w-full py-2 bg-gray-100 text-gray-600 text-sm font-bold text-center rounded-lg",
              )}
            >
              接続中
            </div>
          </div>
        </div>
      )}

      <div class={cn("bg-gray-50 border border-gray-200 rounded-xl p-6")}>
        <h3 class={cn("text-lg font-bold text-gray-700 mb-4")}>接続設定</h3>
        <div class={cn("flex flex-col gap-4")}>
          <div class={cn("flex flex-col gap-2")}>
            <label class={cn("text-sm font-semibold text-gray-600")}>
              名前 (Name)
            </label>
            <input
              type="text"
              value={guest.name}
              onInput={onNameInput}
              class={cn(
                "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 font-medium placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
              )}
              placeholder="あなたの名前を入力"
              disabled={!!guest.uuid}
            />
          </div>
          <button
            type="button"
            onClick={onConnectClicked}
            class={cn(
              "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-200 active:transform active:scale-95 transition-all text-lg mt-2 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none",
            )}
            disabled={!!guest.uuid}
          >
            {guest.uuid ? "接続済み" : "接続する"}
          </button>
        </div>
      </div>
    </div>
  );
});
