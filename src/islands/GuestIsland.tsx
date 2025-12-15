import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "~/components/Icon.tsx";
import { HOST_UUID, LEVEL_DELAY, POWER_DELAY, VENDOR_ID } from "~/consts.ts";
import { cn } from "~/utils/styling.ts";
import {
  GuestWithPort,
  NavigatorWithSerial,
  SerialPort,
  WebSocketMessage,
} from "~/types.ts";
import { defineComponent } from "~/utils/typing.ts";
import { sleep } from "~/utils/functions.ts";

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
    ? `wss://${url.host}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }
    setSocket(socket);

    const onLaunchLoop = async (
      level: number,
      duration: number,
    ) => {
      await sleep(POWER_DELAY + LEVEL_DELAY * level);
      for (let i = 0; i < duration; i++) {
        setGuests(guestsRef.current.map((guest) => {
          if (guest.isTarget) {
            return {
              ...guest,
              timer: guest.timer - 1,
              isRunning: true,
            };
          }
          return guest;
        }));
        await sleep(1000);
      }

      setGuests(guestsRef.current.map((guest) => {
        if (guest.isTarget) {
          return {
            ...guest,
            timer: -1,
            isRunning: false,
            isTarget: false,
          };
        }
        return guest;
      }));
    };

    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      if (message.type === "connect") {
        if (message.data.uuid === HOST_UUID) {
          guestsRef.current.forEach((guest) => {
            const data: WebSocketMessage = {
              type: "connect",
              data: {
                uuid: guest.uuid,
                name: guest.name,
              },
            };
            socket.send(JSON.stringify(data));
          });
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
        const targets = message.data.targets;
        const level = message.data.level;
        const duration = message.data.duration;

        setGuests(guestsRef.current.map((guest) => {
          if (targets.includes(guest.uuid)) {
            return {
              ...guest,
              timer: duration,
              isTarget: true,
            };
          }
          return guest;
        }));

        guestsRef.current.forEach((guest) => {
          if (targets.includes(guest.uuid)) {
            const writer = guest.port.writable.getWriter();
            const encoder = new TextEncoder();
            const parameter = (level << 8) | duration;
            const data = "-> " + String(parameter);
            const chunk = encoder.encode(data);
            writer.write(chunk);
            writer.releaseLock();
          }
        });

        await onLaunchLoop(level, duration);
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
      isTarget: false,
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
    <div class={cn("max-w-md mx-auto")}>
      <button
        type="button"
        onClick={onSerialClick}
        class={cn(
          "w-full py-6 rounded-2xl font-black text-xl mb-8 flex items-center justify-center gap-3 transition-all duration-300",
          "bg-cyan-500 text-white shadow-lg shadow-cyan-200 hover:bg-cyan-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        )}
      >
        <Icon
          icon="icon-[material-symbols-light--usb]"
          class={cn("text-3xl")}
          label="Connect"
        />
        ビリビリデバイスを接続
      </button>

      <div
        class={cn("bg-white rounded-2xl p-6 shadow-sm border border-gray-100")}
      >
        <h2
          class={cn(
            "text-xl font-bold text-gray-800 flex items-center gap-2 mb-6",
          )}
        >
          <Icon
            icon="icon-[material-symbols-light--cable]"
            class={cn("text-2xl text-cyan-500")}
            label="Devices"
          />
          接続中のデバイス
          <span
            class={cn(
              "bg-cyan-100 text-cyan-600 text-sm py-0.5 px-2 rounded-full font-medium",
            )}
          >
            {guests.length}台
          </span>
        </h2>

        {guests.length === 0
          ? (
            <div
              class={cn(
                "text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200",
              )}
            >
              <p class={cn("text-gray-400 font-medium")}>
                接続されているデバイスはありません
              </p>
            </div>
          )
          : (
            <ul class={cn("space-y-3")}>
              {guests.map((guest) => (
                <li
                  key={guest.uuid}
                  class={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                    guest.timer >= 0
                      ? "border-cyan-500 bg-cyan-50/50 shadow-sm"
                      : "border-gray-100 bg-gray-50",
                    guest.isRunning && "animate-vibrate",
                  )}
                >
                  <div
                    class={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      guest.timer >= 0
                        ? "bg-cyan-100 text-cyan-600"
                        : "bg-gray-200 text-gray-500",
                    )}
                  >
                    <Icon
                      icon="icon-[material-symbols-light--electric-bolt]"
                      class={cn("text-2xl")}
                      label="Device"
                    />
                  </div>
                  <div>
                    <div class={cn("font-bold text-gray-800")}>
                      {guest.name}
                    </div>
                    <div class={cn("font-mono flex items-center gap-2")}>
                      {guest.timer >= 0
                        ? (
                          <>
                            <span
                              class={cn("text-lg font-black text-orange-600")}
                            >
                              {guest.timer}
                            </span>
                            <span
                              class={cn(
                                "text-xs font-bold text-gray-400 pt-1",
                              )}
                            >
                              s
                            </span>
                          </>
                        )
                        : (
                          <span class={cn("text-xs font-bold text-gray-400")}>
                            休電中
                          </span>
                        )}
                    </div>
                  </div>
                  <div class={cn("ml-auto")}>
                    {guest.isRunning && (
                      <span
                        class={cn(
                          "text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-full animate-pulse",
                        )}
                      >
                        作動中
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
});
